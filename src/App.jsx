import { useState, useEffect, useRef, Component } from "react";
import { supabase, roleInfo, allowedFor, canOpen, stampLogin, adminCall } from "./supabase.js";
import { MENTORS, mentorById, buildCrmContext, classifyInappropriate, isPureGreeting, categorize, logAi, fetchKnowledge, pickKnowledge } from "./mentors.js";
import {
  BookOpen, Pencil, Trash2, Save, Check,
  LayoutDashboard, UserCircle, FileText, UserPlus, Kanban, BarChart3,
  ShieldAlert, Building2, Gauge, Briefcase, Coins, Settings, Menu, X,
  Phone, MessageCircle, Mail, Search, Bell, ChevronRight, ChevronDown,
  Flame, Clock, MapPin, Eye, EyeOff, Lock, AlertTriangle, CheckCircle2,
  TrendingUp, Users, Wallet, Star, Calendar, Filter, Plus, ArrowUpRight,
  ArrowDownRight, CircleDot, Ban, Download, Globe, Smartphone, Sun, Moon, Unlock, Send, Bot, Fingerprint, KeyRound, LogOut,
  Database, RefreshCw, Upload, Sparkle, Zap, ShieldCheck
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
const WA = "#25D366"; // official WhatsApp green — used for all WhatsApp actions in both themes
const THEME_CSS = `
  html, body { background:#130a26; }
  [data-amber] button { font-family:'Lato', system-ui, -apple-system, sans-serif; font-weight:700; }
  [data-amber] {
    --ink:#0F172A; --inkSoft:#334155; --muted:#64748B; --faint:#94A3B8;
    --bone:#F8FAFC; --paper:#FFFFFF; --hair:#E5E7EB; --hairSoft:#F1F5F9;
    --gold:#7C3AED; --goldBright:#9333EA; --goldSoft:#F3E8FF; --goldEdge:#E9D5FF;
    --ok:#10B981; --okSoft:#D1FAE5; --warn:#F59E0B; --warnSoft:#FEF3C7;
    --bad:#EF4444; --badSoft:#FEE2E2; --info:#0EA5E9; --infoSoft:#E0F2FE;
    --hero:#0F172A; --side:#FFFFFF; --btnBg:#7C3AED; --btnFg:#FFFFFF;
    --goldTint:#FAF5FF; --wm:rgba(124,58,237,.05);
    --shadow:0 1px 2px rgba(15,23,42,.04), 0 6px 18px rgba(15,23,42,.06); --shadowLg:0 2px 4px rgba(15,23,42,.06), 0 18px 44px rgba(15,23,42,.10);
    --sideText:#475569; --sideActiveText:#7C3AED; --sideActiveBg:#F3E8FF; --sideBorder:#EAECF1; --sideBrand:#0F172A;
  }
  [data-amber="dark"] {
    --ink:#F8FAFC; --inkSoft:#CBD5E1; --muted:#94A3B8; --faint:#64748B;
    --bone:#0B1020; --paper:#0F172A; --hair:rgba(148,163,184,.14); --hairSoft:rgba(148,163,184,.07);
    --gold:#A855F7; --goldBright:#C084FC; --goldSoft:#2A1E45; --goldEdge:#4C3A7A;
    --ok:#10B981; --okSoft:#0E2A22; --warn:#F59E0B; --warnSoft:#3A2A0E;
    --bad:#EF4444; --badSoft:#3A1A1A; --info:#38BDF8; --infoSoft:#0C2A3A;
    --hero:#0E1528; --side:#07111F; --btnBg:#7C3AED; --btnFg:#FFFFFF;
    --goldTint:#1A1330; --wm:rgba(168,85,247,.08);
    --shadow:0 2px 8px rgba(0,0,0,.45); --shadowLg:0 10px 34px rgba(0,0,0,.55);
    --sideText:rgba(248,250,252,.66); --sideActiveText:#FFFFFF; --sideActiveBg:linear-gradient(90deg,#7C3AED 0%,#A855F7 100%); --sideBorder:rgba(148,163,184,.12); --sideBrand:#F8FAFC;
  }
  [data-amber] * { box-sizing: border-box; }
  [data-amber] button, [data-amber] select { transition: background .18s ease, border-color .18s ease, color .18s ease, transform .12s ease, box-shadow .18s ease; }
  [data-amber] button:hover { transform: translateY(-1px); }
  [data-amber] button:active { transform: translateY(0); }
  [data-amber] button:focus-visible, [data-amber] select:focus-visible { outline: 2px solid var(--goldBright); outline-offset: 2px; }
  [data-amber] ::selection { background: var(--goldSoft); }
  [data-amber] [style*="Plus Jakarta"] { font-weight: 800; letter-spacing: -0.015em; }
  @media (prefers-reduced-motion: reduce) { [data-amber] button { transition: none; } [data-amber] button:hover { transform: none; } }
  /* iOS Safari auto-zooms when a focused input is < 16px — force 16px on mobile to stop the zoom */
  @media (max-width: 768px) { [data-amber] input, [data-amber] textarea, [data-amber] select { font-size: 16px !important; } }
  html, body { max-width: 100%; overflow-x: hidden; }
  [data-amber] { max-width: 100%; }
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
const DISPLAY = "'Lato', system-ui, -apple-system, sans-serif";
const UI = "'Lato', system-ui, -apple-system, sans-serif";

/* ===== Premium login / auth screen styles (dark + violet, responsive) ===== */
const LOGIN_CSS = `
.al-root{position:fixed;inset:0;z-index:100;overflow-y:auto;font-family:${UI};
  min-height:100vh;min-height:100dvh;
  padding-top:env(safe-area-inset-top);
  padding-bottom:env(safe-area-inset-bottom);
  display:flex;flex-direction:column;
  background:radial-gradient(820px 520px at 18% 88%, rgba(132,86,250,.20), transparent 60%),
    radial-gradient(720px 480px at 86% 14%, rgba(150,95,240,.15), transparent 62%),
    radial-gradient(1100px 720px at 50% 118%, rgba(150,100,245,.14), transparent 66%),
    linear-gradient(180deg, #1c1138 0%, #170d2e 50%, #130a26 100%);
  -webkit-font-smoothing:antialiased;}
.al-root *{box-sizing:border-box;}
.al-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;}
.al-stars{position:absolute;inset:0;opacity:.55;
  background-image:
    radial-gradient(1.5px 1.5px at 24px 36px, rgba(255,255,255,.55), transparent),
    radial-gradient(1.4px 1.4px at 130px 90px, rgba(206,184,255,.5), transparent),
    radial-gradient(1px 1px at 80px 160px, rgba(255,255,255,.45), transparent),
    radial-gradient(1.2px 1.2px at 190px 40px, rgba(210,180,255,.5), transparent),
    radial-gradient(1px 1px at 40px 120px, rgba(255,255,255,.4), transparent);
  background-size:220px 220px;}
.al-glow{position:absolute;border-radius:50%;filter:blur(70px);opacity:.6;}
.al-glowA{width:560px;height:560px;left:-160px;bottom:-120px;background:radial-gradient(circle,rgba(138,86,245,.45),transparent 65%);}
.al-glowB{width:520px;height:520px;right:-150px;top:-160px;background:radial-gradient(circle,rgba(120,80,230,.30),transparent 65%);}
.al-arc{display:none;}
.al-horizon{position:absolute;left:0;right:0;bottom:7%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(180,130,250,.45) 30%,rgba(255,205,150,.28) 50%,rgba(180,130,250,.4) 70%,transparent);opacity:.5;}

.al-wrap{position:relative;z-index:2;flex:1;width:100%;max-width:480px;margin:0 auto;
  display:flex;flex-direction:column;justify-content:center;align-items:stretch;
  padding:14px 18px 22px;}
.al-left{text-align:center;}
.al-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(170,130,240,.42);
  color:#c4a5f7;background:rgba(138,86,245,.09);border-radius:999px;padding:6px 14px;
  font-size:11.5px;font-weight:700;letter-spacing:.09em;margin-bottom:16px;}
.al-pill svg{color:#c4a5f7;}
.al-h1{margin:0 0 14px;font-family:${DISPLAY};font-weight:600;color:#fff;line-height:1.06;
  font-size:38px;letter-spacing:-.01em;}
.al-grad{background:linear-gradient(92deg,#e6c9fb,#ad8cf3 48%,#7d72f0);-webkit-background-clip:text;background-clip:text;color:transparent;}
.al-white{color:#fff;}
.al-welcome-d{display:none;}
.al-welcome-m{display:inline;}
.al-br-m{display:inline;}
.al-sub{margin:0 auto 22px;max-width:440px;font-size:14.5px;line-height:1.5;color:#a8a2c0;}
.al-features{display:none;}
.al-feat{display:flex;flex-direction:column;align-items:flex-start;}
.al-feat-ic{color:#b18cf2;margin-bottom:9px;}
.al-feat-t{font-size:13.5px;font-weight:700;color:#fff;margin-bottom:3px;}
.al-feat-s{font-size:12px;color:#8f88ab;}

.al-right{display:flex;justify-content:center;}
.al-card{width:100%;max-width:480px;position:relative;
  background:rgba(20,15,32,.62);border:1px solid rgba(170,140,235,.16);border-radius:26px;
  box-shadow:0 30px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.05);
  -webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
  padding:26px 22px 24px;}
.al-lockcircle{width:62px;height:62px;border-radius:50%;margin:4px auto 18px;display:grid;place-items:center;
  border:1.5px solid rgba(168,120,240,.5);
  background:radial-gradient(circle,rgba(140,90,240,.18),rgba(140,90,240,.04) 70%);
  box-shadow:0 0 30px rgba(140,90,240,.4),inset 0 0 14px rgba(140,90,240,.18);}
.al-lockcircle svg{color:#c0a3f6;}
.al-card-head{display:none;text-align:center;margin-bottom:18px;}
.al-stage-head{display:block;text-align:center;margin-bottom:18px;}
.al-card-title{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.01em;font-family:${DISPLAY};}
.al-card-desc{font-size:13px;color:#9d96b8;margin-top:6px;line-height:1.45;}
.al-label{display:block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9b94b8;margin:0 0 7px;}
.al-field{position:relative;display:flex;align-items:center;margin-bottom:16px;
  background:rgba(255,255,255,.028);border:1px solid rgba(150,130,210,.2);border-radius:13px;
  transition:border-color .15s,box-shadow .15s;}
.al-field:focus-within{border-color:rgba(168,130,240,.7);box-shadow:0 0 0 3px rgba(140,90,240,.16);}
.al-field-ic{color:#9a86d6;margin:0 0 0 14px;flex:none;}
.al-input{flex:1;min-width:0;border:none;outline:none;background:transparent;color:#f1eefb;
  font-family:${UI};font-size:14.5px;padding:14px 14px 14px 12px;}
.al-input::placeholder{color:#6f6890;}
.al-input-pw{padding-right:6px;}
.al-eye{flex:none;border:none;background:none;cursor:pointer;color:#8a83a8;padding:0 14px;display:grid;place-items:center;}
.al-eye:hover{color:#bdb4dd;}
.al-otp{width:100%;text-align:center;font-size:26px;letter-spacing:16px;font-weight:700;color:#fff;
  background:rgba(255,255,255,.03);border:1px solid rgba(150,130,210,.22);border-radius:13px;
  padding:15px 10px;outline:none;font-family:${UI};margin-bottom:4px;}
.al-otp:focus{border-color:rgba(168,130,240,.7);box-shadow:0 0 0 3px rgba(140,90,240,.16);}
/* Keep browser autofill on-theme: dark fill + white text in every state (Chrome/Safari/Edge). */
.al-root input:-webkit-autofill,
.al-root input:-webkit-autofill:hover,
.al-root input:-webkit-autofill:focus,
.al-root input:-webkit-autofill:active{
  -webkit-text-fill-color:#f1eefb !important;
  -webkit-box-shadow:0 0 0 1000px #161226 inset !important;
  box-shadow:0 0 0 1000px #161226 inset !important;
  caret-color:#f1eefb;
  font-family:${UI};
  transition:background-color 9999s ease-in-out 0s, color 9999s ease-in-out 0s;
}
/* Firefox */
.al-root input:autofill{ -webkit-text-fill-color:#f1eefb; box-shadow:0 0 0 1000px #161226 inset; }
.al-forgot-row{text-align:right;margin:-4px 0 16px;}
.al-forgot{background:none;border:none;cursor:pointer;color:#ab8df1;font-size:12.5px;font-weight:600;font-family:${UI};}
.al-forgot:hover{color:#c4abf7;}
.al-btn{width:100%;border:none;cursor:pointer;color:#fff;font-family:${UI};font-size:15px;font-weight:600;
  border-radius:13px;padding:15px;letter-spacing:.01em;
  background:linear-gradient(92deg,#b98ff4 0%,#8559f3 58%,#7a4ef0 100%);
  box-shadow:0 12px 30px rgba(120,80,240,.42);transition:filter .15s,opacity .15s;}
.al-btn:hover{filter:brightness(1.06);}
.al-btn:disabled{opacity:.6;cursor:default;}
.al-btn:focus-visible{outline:2px solid #c4abf7;outline-offset:2px;}
.al-arrow{display:inline-block;margin-left:6px;}
.al-err{color:#ff90a1;font-size:12.5px;font-weight:600;margin:0 0 12px;}
.al-note{color:#83e3ae;font-size:12.5px;font-weight:600;margin:0 0 12px;}
.al-twofa-row{display:flex;justify-content:space-between;align-items:center;margin-top:14px;}
.al-link{background:none;border:none;cursor:pointer;color:#ab8df1;font-size:12px;font-weight:600;font-family:${UI};}
.al-link:disabled{color:#5f5980;cursor:default;}
.al-link-muted{background:none;border:none;cursor:pointer;color:#8a83a8;font-size:12px;font-family:${UI};}
.al-link-muted:hover{color:#bdb4dd;}
.al-card-secure{display:none;margin-top:20px;}
.al-divider{display:flex;align-items:center;gap:12px;color:#6f6890;font-size:10.5px;font-weight:700;letter-spacing:.16em;margin-bottom:14px;}
.al-divider::before,.al-divider::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.1);}
.al-secure{display:flex;align-items:flex-start;gap:10px;font-size:12px;color:#8a83a8;line-height:1.45;}
.al-secure-ic{color:#9a86d6;flex:none;margin-top:1px;}
.al-secure b{color:#c5bfdd;font-weight:600;}

.al-foot{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:9px;
  text-align:center;padding:14px 22px 22px;font-size:12px;line-height:1.45;color:#8a83a8;}
.al-foot-ic{color:#9a86d6;flex:none;}
.al-foot-desktop{display:none;}
.al-foot-mobile{display:inline;}

@media (min-width:980px){
  .al-wrap{max-width:1180px;flex-direction:row;display:grid;grid-template-columns:1.05fr .95fr;
    gap:56px;align-items:center;min-height:100vh;padding:48px 46px;}
  .al-wrap-solo{display:flex;justify-content:center;align-items:center;max-width:560px;}
  .al-left{text-align:left;}
  .al-h1{font-size:56px;margin-bottom:18px;letter-spacing:-.015em;}
  .al-sub{margin-left:0;font-size:15.5px;}
  .al-welcome-d{display:inline;}
  .al-welcome-m{display:none;}
  .al-br-m{display:none;}
  .al-features{display:flex;gap:0;margin-top:30px;}
  .al-feat{padding:0 22px;}
  .al-feat:first-child{padding-left:0;}
  .al-feat + .al-feat{border-left:1px solid rgba(255,255,255,.1);}
  .al-right{justify-content:flex-end;}
  .al-card{max-width:470px;padding:32px 32px 28px;border-radius:24px;}
  .al-card-head{display:block;}
  .al-arc{display:block;position:absolute;left:-120px;bottom:-300px;width:620px;height:620px;
    border-radius:50%;border:1px solid rgba(170,130,240,.16);}
  .al-foot-desktop{display:inline;color:#b09bf2;}
  .al-foot-mobile{display:none;}
}
`;
const dubaiHour = () => { try { return parseInt(new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai", hour: "2-digit", hour12: false }), 10) % 24; } catch (e) { return new Date().getHours(); } };
const greetWord = (h) => h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 17 ? "Good afternoon" : h >= 17 && h < 22 ? "Good evening" : "Good night";
const dubaiToday = () => { try { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); } catch (e) { return new Date().toISOString().slice(0,10); } };
const firstName = (n) => (n || "there").trim().split(/\s+/)[0];
// Role picker options + label lookup (kept in sync with ROLES in supabase.js).
const ROLE_OPTIONS = [
  ["master_admin", "Master Admin"],
  ["admin", "Admin"],
  ["sales_manager", "Sales Manager"],
  ["agent", "Agent"],
  ["marketing", "Marketing"],
  ["accounts", "Accounts"],
];
function roleLabel(r) { const m = { master_admin: "Master Admin", admin: "Admin", sales_manager: "Sales Manager", agent: "Agent", marketing: "Marketing", accounts: "Accounts" }; return m[r] || (r ? String(r) : "—"); }
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
  ["hotdeals", "Hot Resale Deals", Flame],
  ["ailogs", "Ask Amber Logs", Sparkle],
  ["kb", "AI Knowledge Base", BookOpen],
  ["aisources", "AI Sources & Web", Globe],
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
// Per-screen error boundary: if one screen throws, show a contained message and
// keep the sidebar/header alive. Reset by keying on the active screen.
class ScreenBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { try { console.error("Screen crash:", err, info); } catch (e) {} }
  render() {
    if (this.state.err) {
      return (
        <div style={{ background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 16, padding: 36, textAlign: "center", maxWidth: 460, margin: "40px auto", boxShadow: T.shadow }}>
          <AlertTriangle size={26} color={T.warn} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 800, fontSize: 16, color: T.ink }}>Unable to load this section</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Please refresh, or contact your admin if it keeps happening. Your data is safe.</div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [screen, setScreen] = useState("admin");
  const [navOpen, setNavOpen] = useState(false);
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("amber_theme") === "dark"; } catch (e) { return false; } });
  useEffect(() => { try { localStorage.setItem("amber_theme", dark ? "dark" : "light"); } catch (e) {} }, [dark]);
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
            let initial = ri.home === "agent" ? "agent" : "admin";
            try { const saved = sessionStorage.getItem("amber_screen"); if (saved && saved !== "lead" && saved !== "dealdetail" && canOpen(prof.role, saved)) initial = saved; } catch (e) {}
            setScreen(initial);
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
  // Remember the current top-level screen so a refresh returns here (detail screens need an id, so skip them).
  useEffect(() => {
    if (user && screen !== "lead" && screen !== "dealdetail") { try { sessionStorage.setItem("amber_screen", screen); } catch (e) {} }
  }, [user, screen]);
  const SCREENS = {
    live: <LiveLeads user={user} filter={filter} go={go} openLead={openLead} />, users: <UsersAdmin user={user} />, admin: <AdminDash go={go} />, agent: <AgentDash go={go} user={user} openLead={openLead} />, lead: <LeadDetail leadId={detailId} user={user} go={go} />, open: <LiveLeads user={user} go={go} openLead={openLead} initialAgentFilter="open" heading="Open Leads" sub="Leads currently in the open pool — released by an agent or never assigned. Select one or many and assign them to an active agent. Use the Agent filter to switch between the open pool, unassigned, a specific agent, or everyone." />, kb: <KnowledgeBase user={user} />, projects: <Projects user={user} go={go} />, ailogs: <AiLogs user={user} go={go} />, deals: <Deals user={user} go={go} openDeal={openDeal} />, dealdetail: <DealDetail dealId={dealDetailId} user={user} go={go} />,
    assign: <LiveLeads user={user} go={go} openLead={openLead} initialAgentFilter="unassigned" heading="Lead Assignment" sub="Unassigned leads waiting to be given to an agent. Select one or many, then Assign to agent. Use the Agent filter to view the open pool, a specific agent, or all leads." />, pipeline: <Pipeline go={go} openLead={openLead} />, performance: <Performance go={go} />,
    security: <SecurityLog go={go} />, matching: <Matching go={go} openLead={openLead} />, score: <ScorePage />,
    careers: <Careers />, commission: <Commission />, settings: <SettingsPage />,
    hotdeals: <HotDeals user={user} go={go} />,
    aisources: <AiSources user={user} />,
  };
  const authView = recovery || !authChecked || !user || (user && user.mustChangePw);
  return (
    <div data-amber={dark ? "dark" : "light"} data-accent={accent} style={{ fontFamily: UI, background: authView ? "#130a26" : T.bone, minHeight: "100dvh", display: "flex", color: T.ink,
      transition: "background .25s ease" }}>
      <style>{THEME_CSS}</style>
      {recovery && <ResetPassword onDone={() => { setRecovery(false); setUser(null); try { window.history.replaceState(null, "", window.location.pathname); } catch (e) {} }} />}
      {!recovery && !authChecked && (
        <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "#130a26", zIndex: 100 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, letterSpacing: ".005em", color: "#F4F2FF", fontWeight: 800, lineHeight: 1.1 }}>Amber Homes</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 10, letterSpacing: ".34em", color: "#b794ff", marginTop: 4, fontWeight: 700 }}>REAL ESTATE CRM</div>
            <div style={{ marginTop: 16, fontSize: 12.5, color: "rgba(255,255,255,.55)" }}>Restoring your session…</div>
          </div>
        </div>
      )}
      {!recovery && authChecked && !user && <LoginFlow onLogin={(u) => { setUser(u); setScreen(u.home === "agent" ? "agent" : "admin"); }} dark={dark} setDark={setDark} />}
      {!recovery && user && user.mustChangePw && <ForcedPasswordChange onDone={() => setUser({ ...user, mustChangePw: false })} signOut={signOut} />}
      {/* sidebar */}
      {user && (!narrow || navOpen) && (
        <aside style={{ width: 232, background: T.side, color: "var(--sideText, #fff)", flexShrink: 0, display: "flex",
          flexDirection: "column", position: narrow ? "fixed" : "sticky", top: 0, height: narrow ? "100dvh" : "100vh", paddingBottom: narrow ? "env(safe-area-inset-bottom)" : 0, transition: "background .25s ease",
          borderRight: "1px solid var(--sideBorder, transparent)",
          zIndex: 50, boxShadow: narrow ? "0 0 60px rgba(0,0,0,.4)" : "none" }}>
          <div style={{ padding: narrow ? "calc(env(safe-area-inset-top) + 18px) 20px 18px" : "22px 20px 18px", borderBottom: "1px solid var(--sideBorder, rgba(140,87,255,.18))" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: ".005em", color: "var(--sideBrand, #fff)", fontWeight: 800, lineHeight: 1.1 }}>Amber Homes</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 9.5, letterSpacing: ".34em", color: T.gold, marginTop: 4, fontWeight: 700 }}>REAL ESTATE CRM</div>
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
              <span>Signed in: <span style={{ color: T.gold, fontWeight: 600 }}>{firstName(user.name)} · {user.roleLabel}</span></span>
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
          padding: narrow ? "calc(env(safe-area-inset-top) + 12px) 14px 12px" : "14px 26px", background: T.paper, borderBottom: `1px solid ${T.hair}`,
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
          <ScreenBoundary key={screen}>
            {SCREENS[screen] || <div style={{ ...card, padding: 30, textAlign: "center", color: T.muted }}>This section isn't available. <button onClick={() => go(roleInfo(user.role).home === "agent" ? "agent" : "admin")} style={{ ...miniBtn(), marginLeft: 8 }}>Go to dashboard</button></div>}
          </ScreenBoundary>
        </div>
        <AskAmber narrow={narrow} user={user} openLead={openLead} />
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
  const ini = String(name || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
  return <div style={{ width: size, height: size, borderRadius: size * 0.3, background: dark ? T.hero : T.goldSoft,
    color: dark ? T.goldBright : T.gold, display: "grid", placeItems: "center", fontFamily: DISPLAY,
    fontSize: size * 0.36, flexShrink: 0, border: `1px solid ${dark ? "transparent" : T.goldEdge}` }}>{ini}</div>;
}
function Bar({ pct, color = T.gold, h = 8 }) {
  return <div style={{ background: T.hairSoft, borderRadius: 8, height: h, overflow: "hidden" }}>
    <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 8 }} /></div>;
}
function GoldBtn({ children, ghost, onClick, ...rest }) {
  return <button onClick={onClick} {...rest} style={{ background: ghost ? "transparent" : T.btnBg, color: ghost ? T.ink : T.btnFg,
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
  const [fups, setFups] = useState([]);
  const [projAnn, setProjAnn] = useState([]);
  const [hotDeals, setHotDeals] = useState([]);
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
      // follow-ups for me (RLS already scopes to leads I can see)
      const { data: fu } = await supabase.from("follow_ups")
        .select("id, lead_id, due_at, type, comment, priority, status, notified, lead:leads!follow_ups_lead_id_fkey(client_name, phone)")
        .eq("status", "scheduled").order("due_at", { ascending: true });
      const list = fu || [];
      setFups(list);
      // surface a notification once for each follow-up that has become due
      const nowMs = Date.now();
      const newlyDue = list.filter((f) => !f.notified && new Date(f.due_at).getTime() <= nowMs);
      for (const f of newlyDue) {
        try {
          await supabase.from("notifications").insert({ user_id: uid, kind: "follow_up_due",
            title: "Follow-up due now", body: (f.lead?.client_name || "A client") + " — " + f.type + " follow-up is due", link_screen: "agent" });
          await supabase.from("follow_ups").update({ notified: true }).eq("id", f.id);
        } catch (e) {}
      }
      // featured project announcements + approved hot-deal teaser
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
      try {
        const { data: pj } = await supabase.from("projects")
          .select("name, developer, area, target_client, announcement_text, announcement_priority, announcement_expiry, featured_on_dashboard, agent_visible, deleted")
          .eq("featured_on_dashboard", true).eq("deleted", false);
        const feats = (pj || []).filter((p) => p.agent_visible !== false && (!p.announcement_expiry || p.announcement_expiry >= todayStr))
          .sort((a, b) => (b.announcement_priority || 0) - (a.announcement_priority || 0));
        setProjAnn(feats);
      } catch (e) {}
      try {
        const { data: hot } = await supabase.from("hot_resale_deals")
          .select("project_name, area, property_type, bedrooms, agent_name, featured")
          .eq("status", "Approved").order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(5);
        setHotDeals(hot || []);
      } catch (e) {}
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

  // ---- follow-up buckets (Asia/Dubai) ----
  const nowMs = Date.now();
  const fupDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); } catch (e) { return ""; } };
  const fmtFup = (iso) => { try { return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dubai", weekday: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; } };
  const schedFups = (fups || []).filter((f) => f.status === "scheduled");
  const fDueNow = schedFups.filter((f) => new Date(f.due_at).getTime() <= nowMs);
  const fOverdue = schedFups.filter((f) => fupDate(f.due_at) < today);
  const fToday = schedFups.filter((f) => fupDate(f.due_at) === today);
  const fUpcoming = schedFups.filter((f) => fupDate(f.due_at) > today).slice(0, 8);
  const digitsOf = (p) => String(p || "").replace(/\D/g, "");

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

  const MOTIVATION = ["Every call counts today — work your hot leads first.", "Follow-ups close deals. Clear your due list early.", "One strong viewing can change your month.", "Speed wins in Dubai — reply fast, book the viewing faster.", "Your pipeline is only as warm as your last call."];
  const motiv = MOTIVATION[new Date().getDate() % MOTIVATION.length];
  const projTop = (projAnn || [])[0];
  const hotTop = (hotDeals || [])[0];
  const annText = projTop ? (projTop.announcement_text || (projTop.name + " by " + (projTop.developer || "Amber Homes") + " — check the project knowledge before calling your clients."))
    : hotTop ? ((hotTop.agent_name || "An agent") + " posted a hot resale in " + (hotTop.area || "Dubai") + (hotTop.bedrooms ? " (" + hotTop.bedrooms + " " + hotTop.property_type + ")" : "") + " — do you have a buyer?")
    : null;
  const AnnIcon = projTop ? Building2 : Flame;
  const annGo = projTop ? () => go("projects") : () => go("hotdeals");

  return <div>
    {/* greeting banner */}
    <div style={{ ...card, padding: "22px 24px", background: T.hero, border: "none", boxShadow: T.shadowLg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
        <Av name={user?.name || "Agent"} size={52} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, color: "#fff", lineHeight: 1.1 }}>{greetWord(h)}, {firstName(user?.name)}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.62)", marginTop: 4 }}>{new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", weekday: "long", day: "numeric", month: "long" })} · Dubai</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.82)", marginTop: 7 }}>{motiv}</div>
        </div>
      </div>
      {annText && <div onClick={annGo} style={{ marginTop: 16, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(212,175,92,.22)", display: "grid", placeItems: "center", flexShrink: 0 }}><AnnIcon size={16} color={T.goldBright} /></span>
        <span style={{ fontSize: 13, color: "#fff", fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{annText}</span>
        <ChevronRight size={16} color="rgba(255,255,255,.6)" />
      </div>}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {[["My Leads", Database, () => go("live")], ["Due Today", Clock, () => go("live", { type: "due", label: "Due today" })], ["Ask Amber", Sparkle, () => window.dispatchEvent(new CustomEvent("amber-open"))], ["Projects", Building2, () => go("projects")], ["Hot Deals", Flame, () => go("hotdeals")], ["Plan My Day", Send, runPlan]].map(([label, Ic, fn]) => (
          <button key={label} onClick={fn} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.16)", color: "#fff", borderRadius: 10, padding: "9px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>
            <Ic size={14} color={T.goldBright} /> {label}</button>
        ))}
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
        <button onClick={() => go("deals")} style={{ flex: "1 1 200px", background: T.paper, color: T.ink, border: `1px solid ${T.hair}`,
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

      {/* follow-up reminders (Asia/Dubai) */}
      {schedFups.length > 0 && <div style={{ marginTop: 18 }}>
        {fDueNow.length > 0 && <div onClick={() => fDueNow[0] && openLead && openLead(fDueNow[0].lead_id)} style={{ ...card, padding: "12px 15px", background: T.badSoft, borderColor: T.bad, marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <Bell size={16} color={T.bad} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.bad }}>{fDueNow.length} follow-up{fDueNow.length === 1 ? "" : "s"} due now</span>
          <span style={{ fontSize: 12, color: T.bad, marginLeft: "auto" }}>Tap to open →</span>
        </div>}
        <SectionTitle>Follow-ups</SectionTitle>
        {[["Overdue", fOverdue, "bad"], ["Due today", fToday, "gold"], ["Upcoming", fUpcoming, "muted"]].map(([title, list, tone]) => (
          list.length > 0 ? <div key={title} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: tone === "bad" ? T.bad : tone === "gold" ? T.gold : T.muted, marginBottom: 7 }}>{title} · {list.length}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {list.map((f) => (
                <div key={f.id} style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160, cursor: "pointer" }} onClick={() => openLead && openLead(f.lead_id)}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{f.lead?.client_name || "Client"}</div>
                    <div style={{ fontSize: 12, color: tone === "bad" ? T.bad : T.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Clock size={11} /> {f.type} · {fmtFup(f.due_at)}
                      {f.priority && f.priority !== "Normal" && <span style={{ fontWeight: 700, color: f.priority === "Urgent" ? T.bad : T.warn }}>· {f.priority}</span>}</div>
                    {f.comment && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 3 }}>{f.comment}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => openLead && openLead(f.lead_id)} style={{ ...miniBtn(), padding: "6px 10px", fontSize: 11 }}>Open</button>
                    {f.lead?.phone && <button title="WhatsApp" onClick={() => window.open("https://wa.me/" + digitsOf(f.lead.phone), "_blank")} style={{ ...miniBtn(), padding: "6px 10px", fontSize: 11, borderColor: WA, color: WA }}><MessageCircle size={12} /></button>}
                    {f.lead?.phone && <button title="Call" onClick={() => { window.location.href = "tel:" + digitsOf(f.lead.phone); }} style={{ ...miniBtn(), padding: "6px 10px", fontSize: 11 }}><Phone size={12} /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div> : null
        ))}
      </div>}

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
                  <MessageCircle size={15} color={WA} /></a>}
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
          style={{ fontSize: 11.5, color: WA, fontWeight: 700, textDecoration: "none" }}>WhatsApp</a>}
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
  // follow-up scheduling + completion
  const [schedTime, setSchedTime] = useState("");
  const [schedType, setSchedType] = useState("Call");
  const [schedComment, setSchedComment] = useState("");
  const [schedPriority, setSchedPriority] = useState("Normal");
  const [schedReminder, setSchedReminder] = useState("at_time");
  const [schedErr, setSchedErr] = useState(""); const [schedBusy, setSchedBusy] = useState(false);
  const [editFup, setEditFup] = useState(null);
  const [fups, setFups] = useState([]);
  const [doneFup, setDoneFup] = useState(null);
  const [outcome, setOutcome] = useState(""); const [outcomeNote, setOutcomeNote] = useState("");
  const [doneBusy, setDoneBusy] = useState(false); const [doneErr, setDoneErr] = useState("");
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
    meta: [["status", "Status", "select", ["New", "Contacted", "Interested", "Not Interested", "Hot", "Very Hot", "Warm", "Cold", "No Answer", "Wrong Number", "Hung Up", "Call Back Later", "Follow-Up Scheduled", "Investment Options Sent", "Site Visit Scheduled", "Negotiation", "EOI Collected", "Booking Form Sent", "Closed Won Pending Approval", "Closed Lost", "Dead Lead"]],
      ["temperature", "Temperature", "select", ["Very Hot", "Hot", "Warm", "Cold"]],
      ["last_contacted", "Last contact", "date"], ["next_followup", "Next follow-up", "date"],
      ["source", "Source", "text"]],
  };
  const ALL_KEYS = [].concat(...Object.values(GROUPS)).map((d) => d[0]);
  // Agents may edit progress + profile + requirement — NOT identity/contact/source (also enforced by the DB guard trigger).
  const AGENT_KEYS = ["nationality", "country_residence", "language", "budget", "purpose", "area", "project", "developer", "property_type", "ready_offplan", "finance", "timeline", "status", "temperature", "last_contacted", "next_followup"];
  const LOCKED_FOR_AGENT = ["client_name", "phone", "whatsapp", "email", "source"];
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
    const [{ data: cs }, { data: ts }, { data: fs }] = await Promise.all([
      supabase.from("lead_comments").select("*, author:profiles!lead_comments_author_id_fkey(full_name, role)").eq("lead_id", leadId).eq("deleted", false).order("created_at", { ascending: false }),
      supabase.from("lead_activity").select("*, actor:profiles!lead_activity_actor_id_fkey(full_name, role)").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(60),
      supabase.from("follow_ups").select("*").eq("lead_id", leadId).order("due_at", { ascending: true }),
    ]);
    setComments(cs || []); setTimeline(ts || []); setFups(fs || []);
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
  const reveal = () => { setRevealed(true); logAction("view_number", lead, me && me.id); markContacted(); };
  const askAmberLead = () => {
    try { supabase.from("admin_audit").insert({ action: "ask_amber_lead_opened", performed_by: me && me.id, detail: (lead && (lead.client_name || lead.lead_code)) || null, new_value: { lead_id: lead && lead.id, project: (lead && lead.project) || null } }); } catch (e) {}
    const prompt = "Help me approach this client. Use only the lead details and approved project knowledge — do not invent project details. Lead: " + (lead.client_name || "—")
      + (lead.project ? ", interested in " + lead.project : "") + (lead.area ? " (" + lead.area + ")" : "")
      + (lead.budget ? ", budget " + lead.budget : "") + (lead.purpose ? ", purpose " + lead.purpose : "")
      + (lead.timeline ? ", timeline " + lead.timeline : "") + ", status " + (lead.status || "—") + ", temperature " + (lead.temperature || "—")
      + ". Give me a short client summary, suggested approach, a WhatsApp message, call talking points, and the next best action.";
    window.dispatchEvent(new CustomEvent("amber-open", { detail: { lead, prompt } }));
  };
  const agentNameFor = (id) => { if (!id) return null; if (me && id === me.id) return me.name; const a = agents.find((x) => x.id === id); return a ? a.full_name : null; };
  // Source of truth is the assigned_agent uuid. assigned_agent_name is only a synced fallback (migration 12 backfills it).
  const agentDisplay = lead.is_open ? "Open Lead"
    : lead.assigned_agent ? (agentNameFor(lead.assigned_agent) || lead.assigned_agent_name || "Assigned agent")
    : "Unassigned";
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
    if (error) { setErr2(/permission|protected/i.test(error.message || "") ? "You do not have permission to edit one of those fields." : "Could not save your changes. Please try again."); setSaving(false); return; }
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
      assigned_agent_name: makeOpen ? null : (newId ? (agentNameFor(newId) || null) : null),
      original_agent: lead.original_agent || lead.assigned_agent || newId || null };
    const newName = makeOpen ? "Open Leads pool" : (newId ? (agentNameFor(newId) || "agent") : "Unassigned");
    const { error } = await supabase.from("leads").update(upd).eq("id", lead.id);
    if (error) { setErr2("Unable to reassign this lead. Please try again."); return; }
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
  const FUP_TYPES = ["Call", "WhatsApp", "Meeting", "Site Visit", "Zoom", "Email", "Other"];
  const FUP_OUTCOMES = ["Contacted", "No Answer", "WhatsApp Sent", "Call Done", "Meeting Booked", "Not Interested", "Interested", "Needs Another Follow-Up", "Closed / Deal Submitted", "Other"];
  const OUTCOME_STATUS = { "Not Interested": "Not Interested", Interested: "Interested", "Meeting Booked": "Site Visit Scheduled", "Closed / Deal Submitted": "Closed Won Pending Approval", "No Answer": "No Answer" };
  const CONTACT_OUTCOMES = ["Contacted", "WhatsApp Sent", "Call Done", "Meeting Booked", "Interested"];

  const markContacted = async () => {
    if (!canEdit) return;
    const nowIso = new Date().toISOString();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
    try { await supabase.from("leads").update({ last_contacted: today, last_contacted_at: nowIso, last_contacted_by: me.id }).eq("id", lead.id);
      setLead((l) => ({ ...l, last_contacted: today, last_contacted_at: nowIso, last_contacted_by: me.id })); } catch (e) {}
  };

  const openSchedule = (fup) => {
    if (fup) { setEditFup(fup); const d = new Date(fup.due_at);
      setSchedDate(d.toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }));
      setSchedTime(d.toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" }));
      setSchedType(fup.type || "Call"); setSchedComment(fup.comment || ""); setSchedPriority(fup.priority || "Normal"); setSchedReminder(fup.reminder || "at_time"); }
    else { setEditFup(null); setSchedDate(""); setSchedTime(""); setSchedType("Call"); setSchedComment(""); setSchedPriority("Normal"); setSchedReminder("at_time"); }
    setSchedErr(""); setSched(true);
  };

  const saveSchedule = async () => {
    setSchedErr("");
    if (!schedDate) { setSchedErr("Please choose a follow-up date."); return; }
    if (!schedTime) { setSchedErr("Please choose a follow-up time."); return; }
    if (!schedComment.trim()) { setSchedErr("Please add a short note for this follow-up."); return; }
    const dueAt = new Date(schedDate + "T" + schedTime + ":00+04:00"); // interpret as Asia/Dubai
    if (isNaN(dueAt.getTime())) { setSchedErr("That date/time doesn't look right."); return; }
    if (!isAdmin && dueAt.getTime() < Date.now() - 60000) { setSchedErr("You can't schedule a follow-up in the past."); return; }
    setSchedBusy(true);
    const dueIso = dueAt.toISOString();
    const agentId = lead.assigned_agent || lead.current_owner || me.id;
    try {
      if (editFup) {
        const { error } = await supabase.from("follow_ups").update({ due_at: dueIso, type: schedType, comment: schedComment.trim(), priority: schedPriority, reminder: schedReminder, status: "scheduled", notified: false }).eq("id", editFup.id);
        if (error) throw error;
        await supabase.from("lead_activity").insert({ lead_id: lead.id, actor_id: me.id, action: "followup_rescheduled", detail: { due: dueIso, type: schedType } });
      } else {
        const { error } = await supabase.from("follow_ups").insert({ lead_id: lead.id, agent_id: agentId, created_by: me.id, due_at: dueIso, type: schedType, comment: schedComment.trim(), priority: schedPriority, reminder: schedReminder });
        if (error) throw error;
        await supabase.from("lead_activity").insert({ lead_id: lead.id, actor_id: me.id, action: "followup_scheduled", detail: { due: dueIso, type: schedType, priority: schedPriority } });
      }
      const upd = { next_followup_at: dueIso, next_followup: schedDate };
      if (!["Closed Won Pending Approval", "Closed Lost", "Dead Lead"].includes(lead.status)) upd.status = "Follow-Up Scheduled";
      await supabase.from("leads").update(upd).eq("id", lead.id);
      setLead((l) => ({ ...l, ...upd }));
      if (agentId && agentId !== me.id) await supabase.from("notifications").insert({ user_id: agentId, kind: "follow_up", title: "Follow-up scheduled", body: lead.client_name + " — " + schedType + " on " + schedDate, link_screen: "agent" });
      if (canEditAll) await supabase.from("admin_audit").insert({ action: editFup ? "followup_rescheduled" : "followup_scheduled", performed_by: me.id, new_value: { due: dueIso, type: schedType }, detail: lead.client_name });
      setSched(false); setSchedBusy(false); setEditFup(null);
      const { data: fs } = await supabase.from("follow_ups").select("*").eq("lead_id", lead.id).order("due_at", { ascending: true });
      setFups(fs || []); loadTimeline();
    } catch (e) {
      setSchedBusy(false);
      setSchedErr(/permission|protected/i.test(e.message || "") ? "You do not have permission to do this." : "Unable to schedule follow-up. Please try again.");
    }
  };

  const submitDone = async () => {
    setDoneErr("");
    if (!outcome) { setDoneErr("Please choose an outcome."); return; }
    if (!outcomeNote.trim()) { setDoneErr("Please add an outcome note."); return; }
    setDoneBusy(true);
    const nowIso = new Date().toISOString();
    try {
      const { error } = await supabase.from("follow_ups").update({ status: "completed", outcome, outcome_comment: outcomeNote.trim(), completed_at: nowIso, completed_by: me.id }).eq("id", doneFup.id);
      if (error) throw error;
      await supabase.from("lead_activity").insert({ lead_id: lead.id, actor_id: me.id, action: "followup_completed", detail: { outcome, note: outcomeNote.trim().slice(0, 80) } });
      const leadUpd = {};
      if (CONTACT_OUTCOMES.includes(outcome)) { const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); leadUpd.last_contacted = today; leadUpd.last_contacted_at = nowIso; leadUpd.last_contacted_by = me.id; }
      if (OUTCOME_STATUS[outcome] && !["Closed Won Pending Approval", "Closed Lost", "Dead Lead"].includes(lead.status)) leadUpd.status = OUTCOME_STATUS[outcome];
      if (Object.keys(leadUpd).length) { await supabase.from("leads").update(leadUpd).eq("id", lead.id); setLead((l) => ({ ...l, ...leadUpd })); }
      if (canEditAll) await supabase.from("admin_audit").insert({ action: "followup_completed", performed_by: me.id, new_value: { outcome }, detail: lead.client_name });
      setDoneFup(null); setOutcome(""); setOutcomeNote(""); setDoneBusy(false);
      const { data: fs } = await supabase.from("follow_ups").select("*").eq("lead_id", lead.id).order("due_at", { ascending: true });
      setFups(fs || []); loadTimeline();
    } catch (e) { setDoneBusy(false); setDoneErr("Unable to save. Please try again."); }
  };

  const ACT_LABEL = { view_number: "Viewed number", reveal_phone: "Viewed number", call: "Called", whatsapp: "WhatsApp", schedule: "Scheduled follow-up",
    comment: "Commented", lead_created: "Lead created", lead_created_ai: "Lead created (AI)", status_change: "Status changed", assign: "Assigned",
    reassign: "Reassigned", make_open: "Moved to Open Leads", field_change: "Updated", lead_edited: "Edited details", make_open_bulk: "Moved to open", view: "Viewed",
    followup_scheduled: "Scheduled follow-up", followup_rescheduled: "Rescheduled follow-up", followup_completed: "Completed follow-up" };
  const when = (t) => { const d = (Date.now() - new Date(t)) / 6e4; if (d < 1) return "just now"; if (d < 60) return Math.round(d) + "m ago"; if (d < 1440) return Math.round(d / 60) + "h ago"; return new Date(t).toLocaleDateString(); };
  const fmtDue = (iso) => { try { return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso; } };
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
      <span style={{ color: T.muted, flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>{label}{user && user.role === "agent" && LOCKED_FOR_AGENT.includes(key) && <Lock size={11} color={T.faint} />}</span>
      {canThis ? (
        type === "select" ? <select value={form[key] || ""} onChange={(e) => setF(key, e.target.value)} style={{ ...inp, maxWidth: 200 }}>
          <option value="">—</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : <input type={type === "date" ? "date" : "text"} value={form[key] || ""} onChange={(e) => setF(key, e.target.value)} style={{ ...inp, maxWidth: 200 }} />
      ) : <span style={{ fontWeight: 600, textAlign: "right", color: val ? T.ink : T.faint }}>{val || "Not added yet"}</span>}
    </div>;
  };
  const Btn = ({ icon: Ic, label, onClick, tone }) => <button onClick={onClick} style={{ flex: 1, minWidth: 84, display: "flex", flexDirection: "column",
    alignItems: "center", gap: 5, padding: "12px 8px", borderRadius: 12, border: `1px solid ${tone === "wa" ? WA : tone === "ok" ? T.ok : tone === "gold" ? T.goldEdge : T.hair}`,
    background: tone === "wa" ? "rgba(37,211,102,.12)" : tone === "ok" ? T.okSoft : tone === "gold" ? T.goldSoft : T.paper, color: tone === "wa" ? WA : tone === "ok" ? T.ok : tone === "gold" ? T.gold : T.ink, cursor: "pointer", fontFamily: UI, fontSize: 11.5, fontWeight: 700 }}>
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
        <button onClick={askAmberLead} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(212,175,92,.18)", border: `1px solid ${T.goldEdge}`, color: "#fff", borderRadius: 999, padding: "9px 15px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}><Sparkle size={15} color={T.goldBright} /> Ask Amber</button>
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
      {revealed && lead.phone && <Btn icon={Phone} label="Call" onClick={() => { logAction("call", lead, me && me.id); markContacted(); window.location.href = "tel:" + digits(lead.phone); }} />}
      {lead.phone && <Btn icon={MessageCircle} label="WhatsApp" tone="wa" onClick={() => { logAction("whatsapp", lead, me && me.id); markContacted(); window.open("https://wa.me/" + digits(lead.phone), "_blank"); }} />}
      <Btn icon={Calendar} label="Schedule Follow-Up" onClick={() => openSchedule(null)} />
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

    {/* follow-ups */}
    <SectionTitle right={<GoldBtn ghost onClick={() => openSchedule(null)}><Calendar size={13} /> New follow-up</GoldBtn>}>Follow-ups</SectionTitle>
    <div style={{ ...card, padding: 16 }}>
      {fups.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5 }}>No follow-ups scheduled yet. Use “Schedule Follow-Up” to add one.</div> :
        fups.map((f) => {
          const overdue = f.status === "scheduled" && new Date(f.due_at).getTime() < Date.now();
          return <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "11px 0", borderBottom: `1px solid ${T.hairSoft}` }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Clock size={13} color={overdue ? T.bad : f.status === "completed" ? T.ok : T.gold} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{f.type}</span>
                <span style={{ fontSize: 12, color: overdue ? T.bad : T.muted, fontWeight: 600 }}>{fmtDue(f.due_at)}</span>
                {f.priority && f.priority !== "Normal" && <span style={{ fontSize: 10, fontWeight: 700, color: f.priority === "Urgent" ? T.bad : T.warn, background: f.priority === "Urgent" ? T.badSoft : T.warnSoft, borderRadius: 6, padding: "1px 7px" }}>{f.priority}</span>}
                <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "1px 7px", color: f.status === "completed" ? T.ok : overdue ? T.bad : T.muted, background: f.status === "completed" ? T.okSoft : overdue ? T.badSoft : T.hairSoft }}>{f.status === "completed" ? "Done" : overdue ? "Overdue" : "Scheduled"}</span>
              </div>
              {f.comment && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>{f.comment}</div>}
              {f.status === "completed" && f.outcome && <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Outcome: <b style={{ color: T.ink }}>{f.outcome}</b>{f.outcome_comment ? ' — "' + f.outcome_comment + '"' : ""}</div>}
            </div>
            {f.status === "scheduled" && canEdit && <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => { setDoneFup(f); setOutcome(""); setOutcomeNote(""); setDoneErr(""); }} style={{ ...miniBtn(), padding: "5px 9px", fontSize: 11 }}><Check size={12} /> Done</button>
              <button onClick={() => openSchedule(f)} style={{ ...miniBtn(), padding: "5px 9px", fontSize: 11 }}><RefreshCw size={12} /> Reschedule</button>
            </div>}
          </div>;
        })}
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

    {sched && <Modal title={editFup ? "Reschedule follow-up" : "Schedule follow-up"} onClose={() => { setSched(false); setEditFup(null); }}>
      {(() => { const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted, display: "block", marginTop: 12, marginBottom: 5 };
        const fld = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box" };
        return <>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><span style={{ ...lbl, marginTop: 0 }}>Date *</span><input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} style={fld} /></div>
            <div style={{ flex: 1 }}><span style={{ ...lbl, marginTop: 0 }}>Time *</span><input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} style={fld} /></div>
          </div>
          <span style={lbl}>Type *</span>
          <select value={schedType} onChange={(e) => setSchedType(e.target.value)} style={{ ...fld, background: T.paper }}>{FUP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <span style={lbl}>Note *</span>
          <textarea value={schedComment} onChange={(e) => setSchedComment(e.target.value)} rows={2} placeholder="e.g. Discuss 2BR options in Dubai Hills, send brochure" style={{ ...fld, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><span style={lbl}>Priority</span><select value={schedPriority} onChange={(e) => setSchedPriority(e.target.value)} style={{ ...fld, background: T.paper }}>{["Normal", "High", "Urgent"].map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            <div style={{ flex: 1 }}><span style={lbl}>Reminder</span><select value={schedReminder} onChange={(e) => setSchedReminder(e.target.value)} style={{ ...fld, background: T.paper }}>
              <option value="at_time">At time of follow-up</option><option value="15m">15 minutes before</option><option value="30m">30 minutes before</option><option value="1h">1 hour before</option><option value="1d">1 day before</option></select></div>
          </div>
          {schedErr && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginTop: 12 }}>{schedErr}</div>}
          <button onClick={saveSchedule} disabled={schedBusy} style={{ width: "100%", marginTop: 16, background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: schedBusy ? .6 : 1 }}>{schedBusy ? "Saving…" : editFup ? "Update follow-up" : "Save follow-up"}</button>
        </>; })()}
    </Modal>}

    {doneFup && <Modal title="Complete follow-up" onClose={() => { setDoneFup(null); setOutcome(""); setOutcomeNote(""); }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: 5 }}>Outcome *</span>
      <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={{ width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, color: T.ink, background: T.paper, boxSizing: "border-box" }}>
        <option value="">— Select outcome —</option>{FUP_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}</select>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted, display: "block", marginTop: 12, marginBottom: 5 }}>Outcome note *</span>
      <textarea value={outcomeNote} onChange={(e) => setOutcomeNote(e.target.value)} rows={3} placeholder="What happened on this follow-up?" style={{ width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", resize: "vertical" }} />
      {doneErr && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginTop: 10 }}>{doneErr}</div>}
      <button onClick={submitDone} disabled={doneBusy} style={{ width: "100%", marginTop: 14, background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: doneBusy ? .6 : 1 }}>{doneBusy ? "Saving…" : "Mark as done"}</button>
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

/* Lead Assignment is served by <LiveLeads initialAgentFilter="unassigned"> via the SCREENS map (real data + single & bulk assign). */

/* ============================ 5 PIPELINE BOARD =========================== */
function Pipeline({ go, openLead }) {
  const CANON = ["New", "Contacted", "Interested", "Not Interested", "Hot", "Very Hot", "Warm", "Cold", "Follow-Up Scheduled", "Negotiation", "EOI Collected", "Booking Form Sent", "Closed Won", "Closed Lost", "Dead Lead"];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const { data, error } = await supabase.from("leads")
        .select("id,lead_code,client_name,project,area,budget,status,temperature,assigned_agent_name,is_open,deal_value,next_followup,deleted")
        .order("created_at", { ascending: false }).limit(5000);
      if (error) throw error;
      setRows((data || []).filter((l) => !l.deleted));
    } catch (e) { setErr(e.message || "Could not load the pipeline."); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const statusOf = (l) => l.status || "New";
  const present = Array.from(new Set(rows.map(statusOf)));
  const cols = [...CANON, ...present.filter((s) => !CANON.includes(s))];
  const dotColor = (t) => t === "Very Hot" ? T.bad : t === "Hot" ? T.warn : t === "Warm" ? T.gold : T.faint;
  const aedNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const closedSet = new Set(["Closed Won", "Closed Lost", "Dead Lead"]);
  const activeCount = rows.filter((l) => !closedSet.has(statusOf(l))).length;
  const weighted = rows.reduce((s, l) => s + aedNum(l.deal_value), 0);
  const fmtAED = (n) => n >= 1e6 ? "AED " + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + "M" : n > 0 ? "AED " + n.toLocaleString() : "AED 0";

  return <div>
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 19 }}>Pipeline Board</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, lineHeight: 1.5, maxWidth: 760 }}>Every live lead grouped by its current stage. Click any card to open the full lead. A column with no cards simply has no leads at that stage yet.</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.goldSoft, color: T.gold, borderRadius: 8, padding: "4px 11px", fontSize: 11.5, fontWeight: 700 }}><Database size={13} /> LIVE DATABASE</span>
      <Chip tone="muted">{activeCount} active</Chip>
      <Chip tone="gold">{fmtAED(weighted)} in stages</Chip>
      <div style={{ flex: 1 }} />
      <button onClick={load} style={{ ...miniBtn() }}><RefreshCw size={13} /> Refresh</button>
    </div>
    {loading ? (
      <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>Loading the live pipeline…</div>
    ) : err ? (
      <div style={{ ...card, padding: 30, textAlign: "center" }}>
        <AlertTriangle size={22} style={{ color: T.warn }} />
        <div style={{ fontSize: 13.5, marginTop: 10, color: T.ink }}>{err}</div>
        <div style={{ marginTop: 14 }}><GoldBtn onClick={load}><RefreshCw size={13} /> Try again</GoldBtn></div>
      </div>
    ) : rows.length === 0 ? (
      <div style={{ ...card, padding: 44, textAlign: "center" }}>
        <Kanban size={26} style={{ color: T.faint }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 16, marginTop: 12 }}>No leads in the pipeline yet</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>Once leads are created or imported, they will appear here grouped by stage.</div>
      </div>
    ) : (
      <div style={{ overflowX: "auto", paddingBottom: 10 }}>
        <div style={{ display: "flex", gap: 12, minWidth: Math.max(1100, cols.length * 210) }}>
          {cols.map((st) => {
            const list = rows.filter((l) => statusOf(l) === st);
            return <div key={st} style={{ width: 198, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 9, background: T.hairSoft, marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginLeft: 6 }}>{list.length}</span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {list.map((l) => (
                  <div key={l.id} onClick={() => openLead && openLead(l.id)} style={{ ...card, padding: "10px 11px", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 8, background: dotColor(l.temperature), flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.client_name || "Unnamed lead"}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[l.area, l.budget].filter(Boolean).join(" · ") || "No criteria yet"}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 6 }}>
                      {l.is_open ? <Chip tone="warn">Open</Chip> : l.assigned_agent_name ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0 }}><Av name={l.assigned_agent_name} size={18} /><span style={{ fontSize: 10.5, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{firstName(l.assigned_agent_name)}</span></span> : <Chip tone="muted">Unassigned</Chip>}
                      <span style={{ fontSize: 10, color: T.faint, fontWeight: 600, whiteSpace: "nowrap" }}>{l.lead_code || ""}</span>
                    </div>
                  </div>
                ))}
                {list.length === 0 && <div style={{ fontSize: 11, color: T.faint, textAlign: "center", padding: "14px 0" }}>—</div>}
              </div>
            </div>;
          })}
        </div>
      </div>
    )}
  </div>;
}

/* =========================== 6 AGENT PERFORMANCE ========================= */
function Performance({ go }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const [leadsR, actR, profR, dealsR] = await Promise.all([
        supabase.from("leads").select("assigned_agent,assigned_agent_name,status,temperature,next_followup,last_contacted,deleted").limit(10000),
        supabase.from("lead_activity").select("actor_id,action,created_at").limit(20000),
        supabase.from("profiles").select("id,full_name,role,active,last_login"),
        supabase.from("deals").select("agent_id,status,deleted").limit(10000),
      ]);
      if (leadsR.error) throw leadsR.error;
      if (profR.error) throw profR.error;
      const leads = (leadsR.data || []).filter((l) => !l.deleted);
      const acts = actR.data || [];
      const profs = profR.data || [];
      const deals = (dealsR.data || []).filter((d) => !d.deleted);
      const today = dubaiToday();
      const closedSet = new Set(["Closed Won", "Closed Lost", "Dead Lead"]);
      const build = (name, id, role, active, lastLogin, imported) => {
        const mine = leads.filter((l) => (id && l.assigned_agent === id) || (name && l.assigned_agent_name === name));
        const myActs = id ? acts.filter((a) => a.actor_id === id) : [];
        const myDeals = id ? deals.filter((d) => d.agent_id === id) : [];
        const assigned = mine.length;
        const contacted = mine.filter((l) => l.last_contacted || (l.status && l.status !== "New")).length;
        const won = mine.filter((l) => l.status === "Closed Won").length;
        const notClosed = (l) => !closedSet.has(l.status || "New");
        const overdue = mine.filter((l) => l.next_followup && l.next_followup < today && notClosed(l)).length;
        const due = mine.filter((l) => l.next_followup && l.next_followup >= today && notClosed(l)).length;
        const calls = myActs.filter((a) => a.action === "call").length;
        const wa = myActs.filter((a) => a.action === "whatsapp").length;
        const reveals = myActs.filter((a) => a.action === "view_number" || a.action === "reveal_phone").length;
        const submitted = myDeals.filter((d) => d.status && d.status !== "draft").length;
        const approved = myDeals.filter((d) => d.status === "approved").length;
        const conv = assigned ? Math.round((won / assigned) * 100) : 0;
        return { name, id, role, active, lastLogin, imported, assigned, contacted, won, overdue, due, calls, wa, reveals, submitted, approved, conv };
      };
      const accountRows = profs.filter((p) => p.role === "agent" || p.role === "sales_manager")
        .map((p) => build(p.full_name, p.id, p.role, p.active, p.last_login, false));
      const known = new Set(profs.map((p) => p.full_name).filter(Boolean));
      const orphanNames = Array.from(new Set(leads.map((l) => l.assigned_agent_name).filter((n) => n && !known.has(n))));
      const orphanRows = orphanNames.map((n) => build(n, null, "agent", null, null, true));
      const all = [...accountRows, ...orphanRows].sort((a, b) => b.assigned - a.assigned);
      setRows(all);
    } catch (e) { setErr(e.message || "Could not load performance data."); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const totAgents = rows.filter((r) => !r.imported).length;
  const totAssigned = rows.reduce((s, r) => s + r.assigned, 0);
  const totWon = rows.reduce((s, r) => s + r.won, 0);
  const teamConv = totAssigned ? Math.round((totWon / totAssigned) * 100) : 0;
  const fmtLogin = (d) => { if (!d) return "Never"; try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Dubai" }); } catch (e) { return "—"; } };
  const H = ({ children, w }) => <th style={{ textAlign: "left", padding: "9px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted, whiteSpace: "nowrap", width: w }}>{children}</th>;
  const C = ({ children, strong, tone }) => <td style={{ padding: "10px 10px", fontSize: 12.5, color: tone || (strong ? T.ink : T.inkSoft), fontWeight: strong ? 700 : 500, whiteSpace: "nowrap" }}>{children}</td>;

  return <div>
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 19 }}>Agent Performance</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, lineHeight: 1.5, maxWidth: 760 }}>Live metrics per agent, computed from real leads, contact activity and submitted deals. Click any row to see that agent's leads.</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.goldSoft, color: T.gold, borderRadius: 8, padding: "4px 11px", fontSize: 11.5, fontWeight: 700 }}><Database size={13} /> LIVE DATABASE</span>
      <div style={{ flex: 1 }} />
      <button onClick={load} style={{ ...miniBtn() }}><RefreshCw size={13} /> Refresh</button>
    </div>
    {loading ? (
      <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>Calculating live performance…</div>
    ) : err ? (
      <div style={{ ...card, padding: 30, textAlign: "center" }}>
        <AlertTriangle size={22} style={{ color: T.warn }} />
        <div style={{ fontSize: 13.5, marginTop: 10, color: T.ink }}>{err}</div>
        <div style={{ marginTop: 14 }}><GoldBtn onClick={load}><RefreshCw size={13} /> Try again</GoldBtn></div>
      </div>
    ) : rows.length === 0 ? (
      <div style={{ ...card, padding: 44, textAlign: "center" }}>
        <BarChart3 size={26} style={{ color: T.faint }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 16, marginTop: 12 }}>No performance data yet</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>Activity will appear here once agents are added and start working leads.</div>
      </div>
    ) : (<>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Kpi label="Agents" value={totAgents} />
        <Kpi label="Leads assigned" value={totAssigned} />
        <Kpi label="Closed won" value={totWon} gold />
        <Kpi label="Team conversion" value={teamConv + "%"} />
      </div>
      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.hairSoft}` }}>
              <H>Agent</H><H>Assigned</H><H>Contacted</H><H>Calls</H><H>WhatsApp</H><H>Reveals</H><H>Due</H><H>Overdue</H><H>Won</H><H>Deals</H><H>Approved</H><H>Conv.</H><H>Last login</H>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={(r.id || "x") + i} onClick={() => go && go("live", { type: "agent", value: r.name, label: "Agent: " + r.name })}
                  style={{ borderBottom: i < rows.length - 1 ? `1px solid ${T.hairSoft}` : "none", cursor: "pointer" }}>
                  <C strong>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Av name={r.name} size={26} />
                      <span style={{ display: "inline-flex", flexDirection: "column" }}>
                        <span>{r.name || "Unnamed"}</span>
                        {r.imported ? <span style={{ fontSize: 9.5, color: T.warn, fontWeight: 600 }}>imported · no account</span>
                          : <span style={{ fontSize: 9.5, color: r.active === false ? T.bad : T.faint, fontWeight: 600 }}>{r.active === false ? "deactivated" : roleLabel(r.role)}</span>}
                      </span>
                    </span>
                  </C>
                  <C strong>{r.assigned}</C><C>{r.contacted}</C><C>{r.calls}</C><C>{r.wa}</C><C>{r.reveals}</C>
                  <C>{r.due}</C><C tone={r.overdue > 0 ? T.bad : undefined}>{r.overdue}</C>
                  <C strong tone={r.won > 0 ? T.ok : undefined}>{r.won}</C><C>{r.submitted}</C><C>{r.approved}</C>
                  <C strong>{r.conv}%</C><C>{fmtLogin(r.lastLogin)}</C>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.faint, marginTop: 10, lineHeight: 1.5 }}>Calls, WhatsApp and number-reveals are all-time totals from the activity log and are only available for agents with a CRM account. Agents shown as "imported · no account" came in on lead imports and have no login to attribute activity to.</div>
    </>)}
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
    <SectionTitle>Behavioural alerts</SectionTitle>
    <div style={{ ...card, padding: 28, textAlign: "center", color: T.muted }}>
      <ShieldAlert size={22} color={T.faint} style={{ marginBottom: 8 }} />
      <div style={{ fontWeight: 700, color: T.ink, fontSize: 14 }}>No behavioural alerts flagged</div>
      <div style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.5, maxWidth: 460, marginInline: "auto" }}>Login, device and velocity alerts will appear here as they are detected. The authentication events and Ask Amber misuse shown above are drawn from your live logs.</div>
    </div>
  </div>;
}

/* ========================== 8 PROPERTY MATCHING ========================== */
function Matching({ go, openLead }) {
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [hotdeals, setHotdeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selId, setSelId] = useState(null);
  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const [leadsR, projR, hotR] = await Promise.all([
        supabase.from("leads").select("id,lead_code,client_name,budget,area,property_type,purpose,bedrooms,timeline,project,status,deleted").order("created_at", { ascending: false }).limit(5000),
        supabase.from("projects").select("id,name,developer,area,property_type,starting_price,bedroom_options,golden_visa,status,deleted").limit(2000),
        supabase.from("hot_resale_deals").select("id,project_name,area,property_type,bedrooms,price,status").limit(2000),
      ]);
      if (leadsR.error) throw leadsR.error;
      const ls = (leadsR.data || []).filter((l) => !l.deleted);
      const ps = (projR.error ? [] : (projR.data || [])).filter((p) => !p.deleted && p.status !== "inactive" && p.status !== "sold_out");
      const hs = (hotR.error ? [] : (hotR.data || [])).filter((h) => h.status === "Approved");
      setLeads(ls); setProjects(ps); setHotdeals(hs);
      const first = ls.find((l) => l.budget || l.area) || ls[0];
      setSelId((cur) => cur || (first ? first.id : null));
    } catch (e) { setErr(e.message || "Could not load matching data."); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toNum = (raw) => {
    if (!raw) return null;
    let s = String(raw).toLowerCase().replace(/aed|aud|usd|,|\s/g, "");
    const mult = /m/.test(s) ? 1e6 : /k/.test(s) ? 1e3 : 1;
    const n = parseFloat(s.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n * mult : null;
  };
  const parseRange = (raw) => {
    if (!raw) return null;
    const s = String(raw).trim();
    const plus = /\+\s*$/.test(s);
    const parts = s.split(/\s*(?:–|—|-|to)\s*/i).filter(Boolean);
    if (parts.length >= 2) {
      let a = parts[0], b = parts[1];
      if (!/[mk]/i.test(a) && /[mk]/i.test(b)) a = a + b.replace(/[0-9.]/g, "");
      const lo = toNum(a), hi = toNum(b);
      if (lo == null && hi == null) return null;
      return { lo: lo ?? hi, hi: hi ?? lo };
    }
    const v = toNum(s);
    if (v == null) return null;
    if (plus) return { lo: v, hi: Infinity };
    return { lo: v * 0.9, hi: v * 1.1 };
  };
  const norm = (x) => String(x || "").toLowerCase().trim();
  const overlapText = (a, b) => { const x = norm(a), y = norm(b); if (!x || !y) return null; return x.includes(y) || y.includes(x); };

  const sel = leads.find((l) => l.id === selId) || null;
  const leadRange = sel ? parseRange(sel.budget) : null;
  const score = (price, area, type, golden) => {
    const factors = [];
    let pts = 0;
    // budget 40
    const pr = toNum(price);
    if (!leadRange || pr == null) { pts += 20; factors.push({ k: "Budget", s: "~" }); }
    else if (pr >= leadRange.lo * 0.85 && pr <= (leadRange.hi === Infinity ? Infinity : leadRange.hi * 1.15)) { pts += 40; factors.push({ k: "Budget", s: "ok" }); }
    else factors.push({ k: "Budget", s: "no" });
    // area 30
    const aov = overlapText(sel && sel.area, area);
    if (aov == null) { pts += 15; factors.push({ k: "Area", s: "~" }); }
    else if (aov) { pts += 30; factors.push({ k: "Area", s: "ok" }); }
    else factors.push({ k: "Area", s: "no" });
    // type 20
    const tov = overlapText(sel && sel.property_type, type);
    if (tov == null) { pts += 10; factors.push({ k: "Type", s: "~" }); }
    else if (tov) { pts += 20; factors.push({ k: "Type", s: "ok" }); }
    else factors.push({ k: "Type", s: "no" });
    // golden visa 10 (only if lead purpose mentions visa)
    if (sel && /visa/i.test(sel.purpose || "")) {
      if (golden) { pts += 10; factors.push({ k: "Golden Visa", s: "ok" }); }
      else factors.push({ k: "Golden Visa", s: "no" });
    }
    return { pct: Math.round(pts), factors };
  };

  const matches = sel ? [
    ...projects.map((p) => ({ id: "p" + p.id, kind: "Project", name: p.name, meta: [p.developer, p.area].filter(Boolean).join(" · "), price: p.starting_price, ...score(p.starting_price, p.area, p.property_type, p.golden_visa) })),
    ...hotdeals.map((h) => ({ id: "h" + h.id, kind: "Hot Deal", name: h.project_name || "Resale unit", meta: [h.area, h.property_type].filter(Boolean).join(" · "), price: h.price, ...score(h.price, h.area, h.property_type, false) })),
  ].sort((a, b) => b.pct - a.pct).slice(0, 25) : [];

  const inventory = projects.length + hotdeals.length;
  const FBadge = ({ f }) => { const tone = f.s === "ok" ? "ok" : f.s === "no" ? "bad" : "muted"; const mark = f.s === "ok" ? "✓" : f.s === "no" ? "✗" : "~"; return <Chip tone={tone}>{mark} {f.k}</Chip>; };

  return <div>
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 19 }}>Property Matching</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, lineHeight: 1.5, maxWidth: 760 }}>Pick a real lead and see how your live projects and approved hot resale deals score against their budget, area and unit type. A "~" means that detail isn't recorded on the lead or the listing yet, so it's scored neutrally rather than held against the match.</div>
    </div>
    {loading ? (
      <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>Loading leads and inventory…</div>
    ) : err ? (
      <div style={{ ...card, padding: 30, textAlign: "center" }}>
        <AlertTriangle size={22} style={{ color: T.warn }} />
        <div style={{ fontSize: 13.5, marginTop: 10, color: T.ink }}>{err}</div>
        <div style={{ marginTop: 14 }}><GoldBtn onClick={load}><RefreshCw size={13} /> Try again</GoldBtn></div>
      </div>
    ) : leads.length === 0 ? (
      <div style={{ ...card, padding: 44, textAlign: "center" }}>
        <Users size={26} style={{ color: T.faint }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 16, marginTop: 12 }}>No leads to match yet</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>Add or import leads with a budget and area to enable property matching.</div>
      </div>
    ) : inventory === 0 ? (
      <div style={{ ...card, padding: 44, textAlign: "center" }}>
        <Building2 size={26} style={{ color: T.faint }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 16, marginTop: 12 }}>Not enough real project / property data yet</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>Add active projects or approve hot resale deals and they'll be matched against your leads here.</div>
        <div style={{ marginTop: 16 }}><GoldBtn onClick={() => go && go("projects")}><Building2 size={13} /> Open Projects</GoldBtn></div>
      </div>
    ) : (<>
      <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Av name={sel ? sel.client_name : "?"} dark />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>Matching for</div>
          <select value={selId || ""} onChange={(e) => setSelId(e.target.value)} style={{ width: "100%", maxWidth: 460, padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontSize: 13, fontWeight: 600 }}>
            {leads.map((l) => <option key={l.id} value={l.id}>{(l.client_name || "Unnamed") + (l.lead_code ? " · " + l.lead_code : "") + (l.budget ? " · " + l.budget : "")}</option>)}
          </select>
          {sel && <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>{[sel.budget, sel.area, sel.property_type, /visa/i.test(sel.purpose || "") ? "Golden Visa" : null, sel.timeline].filter(Boolean).join(" · ") || "No criteria recorded on this lead yet"}</div>}
        </div>
        {sel && <GoldBtn ghost onClick={() => openLead && openLead(sel.id)}><Filter size={13} /> Edit criteria</GoldBtn>}
      </div>

      <SectionTitle right={<span style={{ fontSize: 11.5, color: T.muted }}>{matches.length} ranked · {projects.length} projects · {hotdeals.length} hot deals</span>}>Matches · ranked</SectionTitle>
      <div style={{ display: "grid", gap: 12 }}>
        {matches.map((m, i) => (
          <div key={m.id} style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderColor: i === 0 ? T.goldEdge : T.hairSoft, background: i === 0 ? T.goldTint : T.paper }}>
            <div style={{ width: 56, textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 26, color: i === 0 ? T.gold : T.inkSoft }}>{m.pct}</div>
              <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: T.faint, fontWeight: 700 }}>Match</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{m.name}</span>
                <Chip tone={m.kind === "Hot Deal" ? "warn" : "info"}>{m.kind}</Chip>
                {i === 0 && <Chip tone="gold">Best fit</Chip>}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{[m.meta, m.price].filter(Boolean).join(" · ") || "Details not recorded"}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>{m.factors.map((f) => <FBadge key={f.k} f={f} />)}</div>
            </div>
          </div>
        ))}
      </div>
    </>)}
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
/* Open Leads is served by <LiveLeads initialAgentFilter="open"> via the SCREENS map (real open pool + assign). */

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
    ? { name: "", developer: "", area: "", property_type: "", starting_price: "", payment_plan: "", handover_date: "", commission_pct: "", unit_types: "", bedroom_options: "", selling_points: "", investment_points: "", risks_notes: "", golden_visa: "", target_client: "", status: "active", launch_date: "", talking_points: "", do_not_say: "", agent_visible: true, review_date: "", featured_on_dashboard: false, announcement_text: "", announcement_priority: "", announcement_expiry: "" }
    : { ...project, launch_date: project.launch_date || "", review_date: project.review_date || "", announcement_text: project.announcement_text || "", announcement_priority: project.announcement_priority == null ? "" : project.announcement_priority, announcement_expiry: project.announcement_expiry || "", featured_on_dashboard: !!project.featured_on_dashboard };
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
    const row = {}; ["name", "developer", "area", "property_type", "starting_price", "payment_plan", "handover_date", "commission_pct", "unit_types", "bedroom_options", "selling_points", "investment_points", "risks_notes", "golden_visa", "target_client", "status", "talking_points", "do_not_say", "agent_visible", "announcement_text"].forEach((k) => { row[k] = f[k] === "" ? null : f[k]; });
    row.launch_date = f.launch_date || null; row.review_date = f.review_date || null;
    row.featured_on_dashboard = !!f.featured_on_dashboard;
    row.announcement_expiry = f.announcement_expiry || null;
    row.announcement_priority = f.announcement_priority === "" || f.announcement_priority == null ? 0 : Number(f.announcement_priority);
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

        {/* dashboard announcement (Part 7) */}
        <div style={{ marginBottom: 14, ...card, padding: 14, borderColor: f.featured_on_dashboard ? T.goldEdge : T.hair }}>
          <button onClick={() => set("featured_on_dashboard", !f.featured_on_dashboard)} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: UI }}>
            <span style={{ width: 38, height: 22, borderRadius: 999, background: f.featured_on_dashboard ? T.gold : T.hair, position: "relative", transition: "background .15s", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 2, left: f.featured_on_dashboard ? 18 : 2, width: 18, height: 18, borderRadius: 999, background: "#fff", transition: "left .15s" }} /></span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, display: "flex", alignItems: "center", gap: 6 }}><Star size={14} color={f.featured_on_dashboard ? T.gold : T.faint} /> Feature on Agent Dashboard</span>
          </button>
          {f.featured_on_dashboard && <div style={{ marginTop: 12 }}>
            <label style={lbl}>Announcement text <span style={{ textTransform: "none", fontWeight: 500, color: T.faint }}>(leave blank for an auto headline)</span></label>
            <textarea value={f.announcement_text || ""} onChange={(e) => set("announcement_text", e.target.value)} rows={2} style={{ ...pInp, resize: "vertical" }} placeholder={'e.g. "Palm Jebel Ali is launching — are you working your villa clients?"'} />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
              <div style={{ flex: "1 1 140px" }}><label style={lbl}>Priority</label><input type="number" value={f.announcement_priority} onChange={(e) => set("announcement_priority", e.target.value)} style={pInp} placeholder="0 = normal" /></div>
              <div style={{ flex: "1 1 140px" }}><label style={lbl}>Expiry date</label><input type="date" value={f.announcement_expiry || ""} onChange={(e) => set("announcement_expiry", e.target.value)} style={pInp} /></div>
            </div>
          </div>}
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
    if (error) { try { console.error("Deal action failed:", error); } catch (e) {} setErr("Couldn't complete that action. Please try again or contact admin."); setBusy(false); return; }
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

/* ===================== AI SOURCES & WEB RESEARCH (MASTER ADMIN) ===================== */
function AiSources({ user }) {
  const [sources, setSources] = useState(null);
  const [err, setErr] = useState("");
  const [webOn, setWebOn] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const TRUST = { 1: "Government & verification", 2: "Official developers", 3: "Portals & market data", 4: "News & market updates", 5: "Training & regulation" };
  const CATS = ["government", "developer", "portal", "news", "regulation"];

  const load = async () => {
    setErr("");
    try {
      const [sr, st, lg] = await Promise.all([
        supabase.from("ai_sources").select("*").order("trust_level", { ascending: true }).order("domain", { ascending: true }),
        supabase.from("app_settings").select("value").eq("key", "web_research_enabled").maybeSingle(),
        supabase.from("ai_web_log").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      if (sr.error) { setErr("load"); setSources([]); return; }
      setSources(sr.data || []);
      setWebOn(st.data && String(st.data.value).toLowerCase() === "true");
      setLogs(lg.data || []);
    } catch (e) { setErr("load"); setSources([]); }
  };
  useEffect(() => { load(); }, []);

  if (user?.role !== "master_admin") return <div style={{ ...card, padding: 30, textAlign: "center" }}>
    <Lock size={24} color={T.faint} style={{ marginBottom: 8 }} />
    <div style={{ fontWeight: 700 }}>Master Admin only</div>
    <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>AI sources and web research are managed by the Master Admin.</div></div>;

  const toggleWeb = async () => {
    const next = !webOn; setSavingToggle(true); setWebOn(next);
    try { await supabase.from("app_settings").upsert({ key: "web_research_enabled", value: next ? "true" : "false", updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "key" }); }
    catch (e) { setWebOn(!next); }
    setSavingToggle(false);
  };
  const toggleActive = async (s) => {
    setSources((arr) => arr.map((x) => x.id === s.id ? { ...x, active: !x.active } : x));
    try { await supabase.from("ai_sources").update({ active: !s.active, updated_at: new Date().toISOString() }).eq("id", s.id); } catch (e) { load(); }
  };
  const normDomain = (d) => String(d || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  const saveSource = async (f) => {
    const domain = normDomain(f.domain);
    if (!domain || !f.name.trim()) return { error: "Domain and name are required." };
    const row = { domain, name: f.name.trim(), trust_level: Number(f.trust_level) || 3, category: f.category || "developer", active: f.active !== false, notes: f.notes || null, updated_at: new Date().toISOString() };
    try {
      if (editing && editing.id) { const { error } = await supabase.from("ai_sources").update(row).eq("id", editing.id); if (error) throw error; }
      else { const { error } = await supabase.from("ai_sources").insert({ ...row, added_by: user.id }); if (error) throw error; }
      setShowForm(false); setEditing(null); load(); return {};
    } catch (e) { return { error: /duplicate|unique/i.test(e.message || "") ? "That domain is already in the list." : (e.message || "Could not save.") }; }
  };
  const removeSource = async (s) => { setSources((arr) => arr.filter((x) => x.id !== s.id)); try { await supabase.from("ai_sources").delete().eq("id", s.id); } catch (e) { load(); } };

  const fmt = (d) => { if (!d) return "—"; try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai" }); } catch (e) { return "—"; } };
  const list = (sources || []).filter((s) => { if (!q.trim()) return true; const t = q.toLowerCase(); return (s.domain + " " + s.name + " " + s.category).toLowerCase().includes(t); });
  const groups = [1, 2, 3, 4, 5].map((lvl) => [lvl, list.filter((s) => s.trust_level === lvl)]).filter(([, g]) => g.length);
  const activeCount = (sources || []).filter((s) => s.active).length;

  return <div>
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 19 }}>AI Sources &amp; Web Research</div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, lineHeight: 1.5, maxWidth: 760 }}>Ask Amber always checks the Amber Homes Knowledge Base first. When web research is ON, it may also search ONLY the approved domains below — official DLD/government, official developers, then portals/news — and must state a confidence level and source. It will never invent project details.</div>
    </div>

    {err && <div style={{ ...card, padding: 14, marginBottom: 14, borderColor: T.badSoft, color: T.bad, fontSize: 13 }}>Could not load AI sources. Please refresh.</div>}

    <div style={{ ...card, padding: 16, marginBottom: 16, borderColor: webOn ? T.goldEdge : T.hairSoft, background: webOn ? T.goldTint : T.paper }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Globe size={22} color={webOn ? T.gold : T.muted} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Approved-source web research is {webOn ? "ON" : "OFF"}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{webOn ? "Ask Amber may search the approved domains below when something isn't in the Knowledge Base." : "Ask Amber answers only from the Knowledge Base and approved internal project notes. Turn this on to let it search approved official sources too."}</div>
        </div>
        <button onClick={toggleWeb} disabled={savingToggle} style={{ background: webOn ? T.btnBg : T.paper, color: webOn ? T.btnFg : T.ink, border: `1px solid ${webOn ? T.btnBg : T.hair}`, borderRadius: 999, padding: "9px 18px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: savingToggle ? 0.6 : 1 }}>{webOn ? "Turn off" : "Turn on"}</button>
      </div>
      <div style={{ fontSize: 11, color: T.faint, marginTop: 10, lineHeight: 1.5 }}>Note: web research uses Anthropic's server-side web search and only works if your Anthropic plan/key supports it. If answers start failing after turning this on, turn it back off — normal Knowledge-Base answers are unaffected.</div>
    </div>

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.okSoft, color: T.ok, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}><Database size={12} /> {sources === null ? "Loading…" : `${activeCount} active of ${sources.length} sources`}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={load} style={{ ...miniBtn() }}><RefreshCw size={13} /> Refresh</button>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Add source</button>
      </div>
    </div>

    <div style={{ ...card, padding: "10px 14px", marginTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
      <Search size={15} color={T.muted} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search domain, name, category…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: UI, color: T.ink }} />
    </div>

    {sources === null ? <div style={{ ...card, padding: 40, marginTop: 14, textAlign: "center", color: T.muted }}>Loading sources…</div> :
      list.length === 0 ? <div style={{ ...card, padding: 36, marginTop: 14, textAlign: "center", color: T.muted, fontSize: 13 }}>No sources match.</div> :
      groups.map(([lvl, g]) => (
        <div key={lvl} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 14 }}>Trust {lvl}</span>
            <span style={{ fontSize: 11.5, color: T.muted }}>· {TRUST[lvl]}</span>
          </div>
          <div style={{ ...card, overflow: "hidden" }}>
            {g.map((s, i) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.8fr 0.7fr auto", gap: 10, alignItems: "center", padding: "11px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5 }}>
                <span style={{ fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <span style={{ color: T.gold, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.domain}</span>
                <Chip tone="muted">{s.category}</Chip>
                <button onClick={() => toggleActive(s)} title={s.active ? "Active — click to disable" : "Disabled — click to enable"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, justifySelf: "start" }}>
                  <Chip tone={s.active ? "ok" : "muted"}>{s.active ? "Active" : "Off"}</Chip></button>
                <span style={{ display: "flex", gap: 6, justifySelf: "end" }}>
                  <button onClick={() => { setEditing(s); setShowForm(true); }} title="Edit" style={{ ...miniBtn(), padding: "5px 9px" }}><Pencil size={12} /></button>
                  <button onClick={() => removeSource(s)} title="Remove" style={{ ...miniBtn(), padding: "5px 9px", color: T.bad }}><Trash2 size={12} /></button>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

    <SectionTitle>Recent web-research activity</SectionTitle>
    <div style={{ ...card, padding: logs.length ? 0 : 18, overflow: "hidden" }}>
      {logs.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5 }}>No web-research queries yet. They appear here when web research is on and Ask Amber searches an approved source.</div> :
        logs.map((l, i) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5 }}>
            <Globe size={14} color={l.used ? T.gold : T.faint} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.query || "—"}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{l.user_name || "User"} · {fmt(l.created_at)}</div>
            </div>
            <Chip tone={l.used ? "ok" : "muted"}>{l.used ? "Searched" : "KB only"}</Chip>
          </div>
        ))}
    </div>

    {showForm && <AiSourceForm initial={editing} cats={CATS} trust={TRUST} onSave={saveSource} onClose={() => { setShowForm(false); setEditing(null); }} />}
  </div>;
}

function AiSourceForm({ initial, cats, trust, onSave, onClose }) {
  const [f, setF] = useState({ domain: initial?.domain || "", name: initial?.name || "", trust_level: initial?.trust_level || 2, category: initial?.category || "developer", active: initial ? initial.active !== false : true, notes: initial?.notes || "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted, display: "block", marginTop: 12, marginBottom: 5 };
  const fld = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box" };
  const save = async () => { setBusy(true); setErr(""); const r = await onSave(f); setBusy(false); if (r && r.error) setErr(r.error); };
  return <Modal title={initial ? "Edit approved source" : "Add approved source"} onClose={onClose}>
    <span style={{ ...lbl, marginTop: 0 }}>Domain *</span>
    <input value={f.domain} onChange={(e) => set("domain", e.target.value)} placeholder="e.g. emaar.com" style={fld} />
    <span style={lbl}>Name *</span>
    <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Emaar" style={fld} />
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ flex: 1 }}><span style={lbl}>Trust level</span>
        <select value={f.trust_level} onChange={(e) => set("trust_level", e.target.value)} style={{ ...fld, background: T.paper }}>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} — {trust[n]}</option>)}</select></div>
      <div style={{ flex: 1 }}><span style={lbl}>Category</span>
        <select value={f.category} onChange={(e) => set("category", e.target.value)} style={{ ...fld, background: T.paper }}>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
    </div>
    <span style={lbl}>Notes</span>
    <input value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional — what to use this source for" style={fld} />
    <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13, cursor: "pointer" }}>
      <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} style={{ width: 15, height: 15 }} /> Active (Ask Amber may use it when web research is on)</label>
    {err && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginTop: 12 }}>{err}</div>}
    <button onClick={save} disabled={busy} style={{ width: "100%", marginTop: 16, background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : initial ? "Save changes" : "Add source"}</button>
  </Modal>;
}

/* ========================= AI CHAT (ALL USERS) =========================== */
// Detect a CRM lead-list question so Ask Amber can answer it with actionable cards.
const ADMIN_ROLES = ["master_admin", "admin", "sales_manager"];

// Parse a lead query into an intent. role decides whether admin-only report kinds are allowed.
// Optional `target` is an agent name (admins) or a project/area term used to scope results.
function leadIntent(text, role) {
  const t = String(text || "").toLowerCase();
  const isAdmin = ADMIN_ROLES.includes(role);
  let target = "";
  const m = t.match(/\b(?:for|of|assigned to|under|belonging to)\s+([a-z0-9][a-z0-9 .,'&\-]{1,40})/);
  if (m) target = m[1];
  const poss = t.match(/([a-z][a-z .'\-]{1,30})['’]s\s+(?:performance|leads?|stats|numbers|pipeline)/);
  if (!target && poss) target = poss[1];
  target = target.replace(/\b(today|now|this (week|month|year)|last (week|month)|the (week|month)|me|my|all|our|a|the)\b/g, " ")
                 .replace(/\bleads?\b/g, " ").replace(/[?.!,]+/g, " ").replace(/\s+/g, " ").trim();

  // ---- Admin-only report intents (Master Admin / Admin / Sales Manager) ----
  if (/(unassigned|not assigned)\s*leads?/.test(t)) return { kind: "unassigned", adminOnly: true };
  if (/(which|what) projects?.*(most|top).*leads?|top projects? by leads?|projects? with (the )?most leads?|project lead summary/.test(t)) return { kind: "topProjects", adminOnly: true, target };
  if (/agents?/.test(t) && /(not|aren'?t|isn'?t|haven'?t|hasn'?t)\b.*follow|who.*follow.?ups?/.test(t)) return { kind: "laggards", adminOnly: true };
  if (target && /(performance|how (is|are).*doing|stats|numbers|conversion report)/.test(t)) return { kind: "perf", adminOnly: true, target };
  if (/open leads?/.test(t) && !/my open/.test(t)) return { kind: "open", adminOnly: true, target };
  if (/(created|new).*(this|last) week|leads? (created )?this week/.test(t)) return { kind: "recent", adminOnly: true, target };

  // ---- Shared kinds (optionally scoped by target = project, or agent for admins) ----
  if (/(latest|last|most recent|newest)\s+lead|lead.*\b(latest|newest|most recent)\b/.test(t)) return { kind: "latest", target };
  if (/\boverdue\b|missed?\b.*follow|follow.*\bmissed?\b|did i miss.*follow/.test(t)) return { kind: "overdue", target };
  if (/due (today|now)|follow.?ups? due|today'?s follow|follow.?ups? for today/.test(t)) return { kind: "due", target };
  if (/hot leads?|hottest lead|which (leads?|clients?) (should i|to|do i) (call|contact|message|chase)|who (should i|to|do i) (call|message|contact)|which lead.*first|who.*call first/.test(t)) return { kind: "hot", target };
  if (/plan my day|what should i (focus on|do|prioriti[sz]e) today|plan my today/.test(t)) return { kind: "plan" };
  if (/(which (of my )?leads? need)|leads? need (attention|action|a follow|to follow|follow)|which leads? to work/.test(t)) return { kind: "attention", target };
  if (target && /\blead/.test(t)) return { kind: "list", target };
  return null;
}

// Run the lead query against ONLY the data this user may see (agents are hard-filtered to
// their own leads regardless of intent — the security boundary). Admins (master_admin/admin/
// sales_manager) may scope by agent or project and get summary reports. Returns { heading, leads }.
async function runLeadQuery(intent, user) {
  const role = user && user.role;
  const isAgent = role === "agent";
  if (intent.adminOnly && isAgent) {
    return { heading: "That's an admin report — I can only pull your own leads. Try \"show me my hot leads\", \"my latest lead\", or \"my overdue follow-ups\".", leads: [] };
  }
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  const weekAgo = new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  const { data: { user: au } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("leads")
    .select("id, lead_code, lead_no, client_name, area, project, status, temperature, next_followup, last_contacted, phone, budget, purpose, is_open, assigned_agent, assigned_agent_name, current_owner, created_by, created_at, created_on")
    .limit(2000);
  if (error) throw error;
  let rows = data || [];
  if (isAgent && au) rows = rows.filter((l) => l.assigned_agent === au.id || l.current_owner === au.id || l.created_by === au.id);

  const d10 = (v) => String(v || "").slice(0, 10);
  const createdOf = (l) => d10(l.created_at) || d10(l.created_on);
  const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const hotRank = (l) => (l.temperature === "Very Hot" ? 0 : l.temperature === "Hot" ? 1 : l.temperature === "Warm" ? 2 : 3);
  const byDue = (a, b) => d10(a.next_followup).localeCompare(d10(b.next_followup));
  const byNew = (a, b) => (createdOf(b) || "").localeCompare(createdOf(a) || "");
  const fmtDue = (v) => { const s = d10(v); if (!s) return "no follow-up set"; if (s < today) return "overdue (" + s + ")"; if (s === today) return "due today"; return "due " + s; };

  // Scope by target (admins: agent name preferred, else project; agents: project only).
  const target = norm(intent.target);
  let scopeLabel = "";
  if (target) {
    const byAgent = isAgent ? [] : rows.filter((l) => norm(l.assigned_agent_name).includes(target));
    const byProj = rows.filter((l) => norm(l.project).includes(target) || norm(l.area).includes(target));
    if (byAgent.length && byAgent.length >= byProj.length) { rows = byAgent; scopeLabel = intent.target.trim(); }
    else if (byProj.length) { rows = byProj; scopeLabel = intent.target.trim(); }
    else if (byAgent.length) { rows = byAgent; scopeLabel = intent.target.trim(); }
    else { rows = []; scopeLabel = intent.target.trim(); }
  }

  const open = rows.filter((l) => l.status !== "Closed Won" && l.status !== "Closed Lost");
  const overdueOf = (arr) => arr.filter((l) => d10(l.next_followup) && d10(l.next_followup) < today);
  const tempSplit = (arr) => { const hot = arr.filter((l) => hotRank(l) <= 1).length, warm = arr.filter((l) => l.temperature === "Warm").length; return `${hot} hot · ${warm} warm · ${arr.length - hot - warm} cold`; };
  const forLbl = scopeLabel ? " for " + scopeLabel : "";

  let picked = [], heading = "";
  if (intent.kind === "latest") {
    picked = [...rows].sort(byNew).slice(0, 1);
    heading = picked.length ? `Your latest lead${forLbl} is below.` : `No leads found${forLbl}.`;
  } else if (intent.kind === "overdue") {
    picked = overdueOf(open).sort(byDue);
    heading = picked.length ? `${picked.length} overdue follow-up${picked.length > 1 ? "s" : ""}${forLbl}. Start here:` : `No overdue follow-ups${forLbl} — all caught up.`;
  } else if (intent.kind === "due") {
    picked = open.filter((l) => d10(l.next_followup) && d10(l.next_followup) <= today).sort(byDue);
    heading = picked.length ? `${picked.length} follow-up${picked.length > 1 ? "s" : ""} due today or earlier${forLbl}:` : `Nothing due today${forLbl}.`;
  } else if (intent.kind === "hot") {
    picked = open.filter((l) => hotRank(l) <= 1).sort((a, b) => hotRank(a) - hotRank(b) || byDue(a, b));
    heading = picked.length ? `${picked.length} hot lead${picked.length > 1 ? "s" : ""}${forLbl}${picked.length > 8 ? " (top 8)" : ""}. Start with these:` : `No hot leads${forLbl} right now.`;
  } else if (intent.kind === "unassigned") {
    picked = open.filter((l) => !l.assigned_agent && !norm(l.assigned_agent_name));
    heading = picked.length ? `${picked.length} unassigned open lead${picked.length > 1 ? "s" : ""}:` : "No unassigned open leads.";
  } else if (intent.kind === "open") {
    const o = open.filter((l) => l.is_open); picked = o.length ? o : open;
    heading = `${picked.length} open lead${picked.length > 1 ? "s" : ""}${forLbl}:`;
  } else if (intent.kind === "recent") {
    picked = rows.filter((l) => createdOf(l) && createdOf(l) >= weekAgo).sort(byNew);
    heading = picked.length ? `${picked.length} lead${picked.length > 1 ? "s" : ""} created in the last 7 days${forLbl}:` : `No leads created in the last 7 days${forLbl}.`;
  } else if (intent.kind === "perf") {
    const won = rows.filter((l) => l.status === "Closed Won").length, lost = rows.filter((l) => l.status === "Closed Lost").length;
    heading = `${scopeLabel || "Agent"} — ${rows.length} leads · ${tempSplit(rows)} · ${overdueOf(open).length} overdue · ${won} won / ${lost} lost.` + (open.length ? " Priority leads:" : "");
    picked = open.filter((l) => hotRank(l) <= 1 || (d10(l.next_followup) && d10(l.next_followup) < today)).sort((a, b) => hotRank(a) - hotRank(b) || byDue(a, b));
  } else if (intent.kind === "topProjects") {
    const counts = {}; open.forEach((l) => { const p = l.project || l.area || "—"; counts[p] = (counts[p] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    heading = top.length ? "Projects by open-lead count:\n" + top.map(([p, c], i) => `${i + 1}. ${p} — ${c} lead${c > 1 ? "s" : ""}`).join("\n") : "No open leads to summarise.";
  } else if (intent.kind === "laggards") {
    const byAg = {}; overdueOf(open).forEach((l) => { const a = l.assigned_agent_name || "Unassigned"; byAg[a] = (byAg[a] || 0) + 1; });
    const top = Object.entries(byAg).sort((a, b) => b[1] - a[1]).slice(0, 10);
    heading = top.length ? "Most overdue follow-ups by agent:\n" + top.map(([a, c]) => `• ${a} — ${c} overdue`).join("\n") : "No overdue follow-ups across the team — everyone's current.";
  } else if (intent.kind === "attention") {
    const overdue = overdueOf(open); const hot = open.filter((l) => hotRank(l) <= 1 && !overdue.includes(l)); const noDate = open.filter((l) => !d10(l.next_followup) && !hot.includes(l) && !overdue.includes(l));
    const seen = new Set(); picked = []; [...overdue.sort(byDue), ...hot, ...noDate].forEach((l) => { if (!seen.has(l.id)) { seen.add(l.id); picked.push(l); } });
    heading = picked.length ? `These leads need attention first${forLbl}:` : `Nothing urgent${forLbl} — pipeline looks under control.`;
  } else if (intent.kind === "list") {
    picked = [...rows].sort((a, b) => hotRank(a) - hotRank(b) || byNew(a, b));
    if (!isAgent && rows.length) heading = `${rows.length} lead${rows.length > 1 ? "s" : ""} for ${scopeLabel} · ${tempSplit(rows)} · ${overdueOf(open).length} overdue.` + (picked.length > 8 ? " Showing top 8:" : "");
    else heading = picked.length ? `Your leads for ${scopeLabel}:` : `No leads found for ${scopeLabel}.`;
  } else { // plan
    const overdue = overdueOf(open).sort(byDue); const due = open.filter((l) => d10(l.next_followup) === today); const hot = open.filter((l) => hotRank(l) <= 1 && d10(l.next_followup) !== today && !overdue.includes(l));
    const seen = new Set(); picked = []; [...overdue, ...due, ...hot].forEach((l) => { if (!seen.has(l.id)) { seen.add(l.id); picked.push(l); } });
    heading = picked.length ? `Your plan — ${overdue.length} overdue, ${due.length} due today, plus hot leads. Work top to bottom:` : "Your pipeline is clear for today. Add follow-up dates and I'll build your day around them.";
  }

  const reasonFor = (l) => {
    const bits = []; const s = d10(l.next_followup);
    if (hotRank(l) === 0) bits.push("Very hot"); else if (hotRank(l) === 1) bits.push("Hot lead");
    if (s && s < today) bits.push("follow-up overdue"); else if (s === today) bits.push("follow-up due today"); else if (!s) bits.push("no follow-up set");
    if (!isAgent && l.assigned_agent_name) bits.push("agent: " + l.assigned_agent_name);
    if (l.project) bits.push("interest: " + l.project);
    return bits.join(" · ") || "Worth a touch";
  };
  const leads = picked.slice(0, 8).map((l) => ({
    id: l.id, name: l.client_name || "Lead", code: l.lead_code || l.lead_no || "", project: l.project || l.area || "—",
    status: l.is_open ? "Open" : (l.status || "—"), temp: l.temperature || "—", budget: l.budget || "",
    due: fmtDue(l.next_followup), phone: l.phone || "", reason: reasonFor(l),
  }));
  return { heading, leads };
}

function AskAmber({ narrow, user, openLead }) {
  const [open, setOpen] = useState(false);
  const [mentor, setMentor] = useState(null);     // chosen mentor object
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [kb, setKb] = useState([]);                // Amber Homes knowledge (loaded once per session)
  const boxRef = useRef(null);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs, busy]);

  const pick = async (m, leadCtx) => {
    setMentor(m);
    setMsgs([{ role: "assistant", text: m.greeting }]);
    setCtx(await buildCrmContext(user, leadCtx)); // fetch permitted CRM context once per session
    fetchKnowledge(user).then(setKb).catch(() => setKb([])); // verified company knowledge
  };
  const reset = () => { setMentor(null); setMsgs([]); setInput(""); };
  useEffect(() => {
    const onOpen = async (e) => {
      const d = e && e.detail;
      setOpen(true);
      if (!mentor) pick(MENTORS[0], d && d.lead);
      else if (d && d.lead) { try { setCtx(await buildCrmContext(user, d.lead)); } catch (err) {} }
      if (d && d.prompt) setInput(d.prompt);
    };
    window.addEventListener("amber-open", onOpen);
    return () => window.removeEventListener("amber-open", onOpen);
  }, [mentor]);

  const logLeadAction = (action, ld) => { try { logAi({ user, mentor, question: "[lead action: " + action + "] " + (ld.name || ld.id), responseSum: "lead_action:" + action, category: "crm", status: "success" }); } catch (e) {} };
  const draftFor = (ld) => {
    const q = `Draft a short, warm WhatsApp follow-up message for my lead ${ld.name}${ld.project && ld.project !== "—" ? " (interested in " + ld.project + ")" : ""}. One short paragraph, professional, ready to copy.`;
    send(q);
  };
  const send = async (q) => {
    const text = (q != null ? q : input).trim();
    if (!text || busy || !mentor) return;
    setInput("");
    // Pure courtesy/greeting → friendly in-persona reply, no model call, never flagged or refused.
    if (isPureGreeting(text)) {
      const courtesy = { ambreen_ai: "Doing great — now tell me which client we're converting today? Send me a lead, objection, project or follow-up and I'll help you handle it.",
        saad_ai: "I'm ready. Share the lead, project or client situation and I'll give you the best next move.",
        ibrahim_ai: "All good — let's make your day productive. Which lead or project are we working on?" }[mentor.id] || "Ready to help — send me a lead, client, project or follow-up.";
      setMsgs((m) => [...m, { role: "user", text }, { role: "assistant", text: courtesy }]);
      logAi({ user, mentor, question: text, responseSum: courtesy, fullResponse: courtesy, category: "greeting", status: "success" });
      return;
    }
    // client-side guard: refuse obvious non-work content without calling the model
    const cat = classifyInappropriate(text);
    if (cat) {
      const refusal = { ambreen_ai: "Let's keep Ask Amber for the real work — that one's not for me. Send me a lead, objection, project or follow-up and I'll help you win it.",
        saad_ai: "That's outside what I'm here for. Bring me a lead, client, deal, project or CRM question and I'll give you the move.",
        ibrahim_ai: "Let's keep it work-related — easy. Send me a client, WhatsApp reply, lead or follow-up and I'll help you sort it." }[mentor.id];
      setMsgs((m) => [...m, { role: "user", text }, { role: "assistant", text: refusal }]);
      logAi({ user, mentor, question: text, responseSum: "[refused: " + cat + "]", status: "refused", flagCategory: cat });
      return;
    }
    // CRM lead-list question → answer with actionable lead cards (RLS limits to permitted leads).
    const li = leadIntent(text, user && user.role);
    if (li) {
      setMsgs((m) => [...m, { role: "user", text }]); setBusy(true);
      try {
        const out = await runLeadQuery(li, user);
        setMsgs((m) => [...m, { role: "assistant", text: out.heading, leads: out.leads }]);
        logAi({ user, mentor, question: text, responseSum: out.heading + " (" + out.leads.length + " leads)", category: "follow_up", status: "success" });
      } catch (e) {
        setMsgs((m) => [...m, { role: "assistant", text: "I couldn't pull your leads just now. Please try again." }]);
        logAi({ user, mentor, question: text, status: "error" });
      } finally { setBusy(false); }
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
        // Approved-source web research (only happens when Master Admin has enabled it; domains are restricted server-side).
        const webBlocks = (data.content || []).filter((b) => b.type === "web_search_tool_result");
        const webUsed = webBlocks.length > 0 || (data.content || []).some((b) => b.type === "server_tool_use" && b.name === "web_search");
        const webDomains = [];
        webBlocks.forEach((b) => (Array.isArray(b.content) ? b.content : []).forEach((r) => {
          try { const h = new URL(r.url).hostname.replace(/^www\./, ""); if (h && !webDomains.includes(h)) webDomains.push(h); } catch (e) {} }));
        const kbSources = picked.used && picked.used.length
          ? picked.used.filter((u) => !/do not say|compliance/i.test(u.title)).slice(0, 3).map((u) => u.title)
          : [];
        const sources = [...kbSources, ...webDomains.slice(0, 4)];
        setMsgs((m) => [...m, { role: "assistant", text: reply || "Please try again.", sources }]);
        logAi({ user, mentor, question: text, responseSum: reply, fullResponse: reply, category: categorize(text), model: data.model, status: "success", tokensIn: data.usage && data.usage.input_tokens, tokensOut: data.usage && data.usage.output_tokens });
        if (data.web_enabled) { try { supabase.from("ai_web_log").insert({ user_id: user.id, user_name: user.name, user_role: user.role, query: String(text).slice(0, 500), used: webUsed, domains: data.web_domains || 0 }); } catch (e) {} }
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
              {m.leads && m.leads.length > 0 && (
                <div style={{ width: "100%", display: "grid", gap: 8, marginTop: 8 }}>
                  {m.leads.map((ld) => {
                    const tcol = /hot/i.test(ld.temp) ? T.bad : ld.temp === "Warm" ? T.warn : T.muted;
                    const cardBtn = { ...miniBtn(), padding: "6px 9px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 };
                    const ph = String(ld.phone || "").replace(/\D/g, "");
                    return (
                      <div key={ld.id} style={{ background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 12, padding: "10px 12px", boxShadow: T.shadow }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 12.8, color: T.ink }}>{ld.name}{ld.code ? <span style={{ fontSize: 10, color: T.faint, fontWeight: 600, marginLeft: 6 }}>{ld.code}</span> : null}</div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: tcol, whiteSpace: "nowrap" }}>{ld.temp}</div>
                        </div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{ld.project} · {ld.status}{ld.budget ? " · " + ld.budget : ""} · {ld.due}</div>
                        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 3, lineHeight: 1.4 }}>{ld.reason}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          <button onClick={() => { logLeadAction("open", ld); if (openLead) { openLead(ld.id); setOpen(false); } }} style={cardBtn}>Open Lead</button>
                          {ph && <button onClick={() => { logLeadAction("whatsapp", ld); window.open("https://wa.me/" + ph, "_blank"); }} style={{ ...cardBtn, borderColor: WA, color: WA }}><MessageCircle size={11} /> WhatsApp</button>}
                          {ph && <button onClick={() => { logLeadAction("call", ld); window.location.href = "tel:" + ph; }} style={cardBtn}><Phone size={11} /> Call</button>}
                          <button onClick={() => draftFor(ld)} style={cardBtn}><Sparkle size={11} /> Draft message</button>
                        </div>
                      </div>
                    );
                  })}
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

function LoginFlow({ onLogin }) {
  const [stage, setStage] = useState("creds");   // creds | twofa | setpw | forgot
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
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
  const submitForgot = async () => {
    setErr(""); setNote(""); const mail = email.trim().toLowerCase();
    if (!mail.includes("@")) { setErr("Enter your work email to receive a reset link."); return; }
    setBusy(true); setEmail(mail);
    const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: window.location.origin });
    try { await supabase.from("auth_logs").insert({ email: mail, event: "forgot_requested", status: error ? "fail" : "ok" }); } catch (e) {}
    setBusy(false);
    if (error) setErr("Could not send the reset email. Please try again.");
    else setNote("If that email exists, a reset link is on its way. Check your inbox.");
  };

  return (
    <div className="al-root">
      <style>{LOGIN_CSS}</style>
      <div className="al-bg" aria-hidden="true">
        <div className="al-stars" />
        <div className="al-glow al-glowA" />
        <div className="al-glow al-glowB" />
        <div className="al-arc" />
        <div className="al-horizon" />
      </div>

      <div className="al-wrap">
        <div className="al-left">
          <div className="al-pill"><Sparkle size={13} /> AI-POWERED CRM</div>
          <h1 className="al-h1">
            <span className="al-welcome-d">Welcome to</span>
            <span className="al-welcome-m">Welcome back</span>
            <br />
            <span className="al-grad">Amber Homes</span><span className="al-br-m"><br /></span> <span className="al-white">AI CRM</span>
          </h1>
          <p className="al-sub">Smart relationships. Streamlined operations. AI-powered growth for modern real estate professionals.</p>
          <div className="al-features">
            <div className="al-feat"><Users size={20} className="al-feat-ic" /><div className="al-feat-t">Smart Contacts</div><div className="al-feat-s">AI-enriched insights</div></div>
            <div className="al-feat"><Zap size={20} className="al-feat-ic" /><div className="al-feat-t">Automated Workflows</div><div className="al-feat-s">Save time, close more</div></div>
            <div className="al-feat"><BarChart3 size={20} className="al-feat-ic" /><div className="al-feat-t">Real-time Analytics</div><div className="al-feat-s">Data that drives results</div></div>
          </div>
        </div>

        <div className="al-right">
          <div className="al-card">
            <div className="al-lockcircle"><Lock size={24} /></div>

            {stage === "creds" && <>
              <div className="al-card-head">
                <div className="al-card-title">Sign in to your dashboard</div>
                <div className="al-card-desc">Use your Amber Homes work email and password.</div>
              </div>
              <label className="al-label" htmlFor="al-email">Work email</label>
              <div className="al-field">
                <Mail size={16} className="al-field-ic" />
                <input id="al-email" className="al-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@amberhomes.ae" autoComplete="username" onKeyDown={(e) => { if (e.key === "Enter") submitCreds(); }} />
              </div>
              <label className="al-label" htmlFor="al-pw">Password</label>
              <div className="al-field">
                <Lock size={16} className="al-field-ic" />
                <input id="al-pw" className="al-input al-input-pw" type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" onKeyDown={(e) => { if (e.key === "Enter") submitCreds(); }} />
                <button type="button" className="al-eye" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"} tabIndex={-1}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <div className="al-forgot-row"><button type="button" className="al-forgot" onClick={() => { setErr(""); setNote(""); setStage("forgot"); }}>Forgot password?</button></div>
              {err && <div className="al-err">{err}</div>}
              {note && <div className="al-note">{note}</div>}
              <button className="al-btn" onClick={submitCreds} disabled={busy}>{busy ? "Signing in…" : <>Sign in <span className="al-arrow">→</span></>}</button>
              <div className="al-card-secure">
                <div className="al-divider"><span>SECURE ACCESS</span></div>
                <div className="al-secure"><Lock size={15} className="al-secure-ic" /><div><b>Your data is encrypted and secure.</b><br />Access is restricted to authorized users only.</div></div>
              </div>
            </>}

            {stage === "twofa" && <>
              <div className="al-stage-head">
                <div className="al-card-title">Enter your verification code</div>
                <div className="al-card-desc">{note || ("Enter the verification code sent to " + email + ".")}</div>
              </div>
              <input className="al-otp" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="• • • •" inputMode="numeric" autoComplete="one-time-code" onKeyDown={(e) => { if (e.key === "Enter") submitCode(); }} />
              {err && <div className="al-err" style={{ marginTop: 12 }}>{err}</div>}
              <button className="al-btn" style={{ marginTop: 14 }} onClick={submitCode} disabled={busy}>{busy ? "Verifying…" : "Verify & continue"}</button>
              <div className="al-twofa-row">
                <button type="button" className="al-link-muted" onClick={() => { setStage("creds"); setErr(""); setCode(""); }}>← Back</button>
                <button type="button" className="al-link" onClick={resend} disabled={resendIn > 0}>{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}</button>
              </div>
            </>}

            {stage === "forgot" && <>
              <div className="al-stage-head">
                <div className="al-card-title">Reset your password</div>
                <div className="al-card-desc">Enter your work email and we'll send you a secure reset link.</div>
              </div>
              <label className="al-label" htmlFor="al-fmail">Work email</label>
              <div className="al-field">
                <Mail size={16} className="al-field-ic" />
                <input id="al-fmail" className="al-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@amberhomes.ae" autoComplete="username" onKeyDown={(e) => { if (e.key === "Enter") submitForgot(); }} />
              </div>
              {err && <div className="al-err">{err}</div>}
              {note && <div className="al-note">{note}</div>}
              <button className="al-btn" onClick={submitForgot} disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
              <div className="al-twofa-row" style={{ justifyContent: "center" }}>
                <button type="button" className="al-link-muted" onClick={() => { setStage("creds"); setErr(""); setNote(""); }}>← Back to sign in</button>
              </div>
            </>}

            {stage === "setpw" && <>
              <div className="al-stage-head">
                <div className="al-card-title">Set your password</div>
                <div className="al-card-desc">{note || "Please choose a new password to continue."}</div>
              </div>
              <label className="al-label">New password</label>
              <div className="al-field">
                <Lock size={16} className="al-field-ic" />
                <input className="al-input al-input-pw" type={showPw ? "text" : "password"} value={npw} onChange={(e) => setNpw(e.target.value)} placeholder="At least 8 characters" />
                <button type="button" className="al-eye" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password" tabIndex={-1}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <label className="al-label">Confirm new password</label>
              <div className="al-field">
                <Lock size={16} className="al-field-ic" />
                <input className="al-input" type={showPw ? "text" : "password"} value={npw2} onChange={(e) => setNpw2(e.target.value)} placeholder="Re-enter password" onKeyDown={(e) => { if (e.key === "Enter") submitNewPw(); }} />
              </div>
              {err && <div className="al-err">{err}</div>}
              <button className="al-btn" onClick={submitNewPw} disabled={busy}>{busy ? "Saving…" : "Save & continue"}</button>
            </>}
          </div>
        </div>
      </div>

      <div className="al-foot">
        <ShieldCheck size={15} className="al-foot-ic" />
        <span className="al-foot-desktop">Your success is our foundation. Let's build extraordinary together.</span>
        <span className="al-foot-mobile">Your data is encrypted and secure. Access is restricted to authorized users only.</span>
      </div>
    </div>
  );
}

function LiveLeads({ user, filter, go, openLead, initialAgentFilter = null, heading = null, sub = null }) {
  const isAgent = user && user.role === "agent";
  const [leads, setLeads] = useState(null);   // null = loading
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [revealed, setRevealed] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [me, setMe] = useState(null);
  const [sort, setSort] = useState("newest");
  const [agentFilter, setAgentFilter] = useState(initialAgentFilter);   // null | 'unassigned' | 'open' | <agentId>
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState({});            // { [leadId]: true }
  const [showBulk, setShowBulk] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    setErr("");
    const { data: { user: au } } = await supabase.auth.getUser();
    setMe(au);
    const { data, error } = await supabase.from("leads")
      .select("id, lead_code, lead_no, client_name, phone, whatsapp, email, project, area, budget, assigned_agent_name, assigned_agent, original_agent, current_owner, created_by, status, temperature, source, is_open, opened_reason, next_followup, last_contacted, created_on, created_at, assigned_at")
      .order("created_at", { ascending: false }).limit(2000);
    if (error) { try { console.error("Leads load failed:", error); } catch (e) {} setErr("Unable to load leads right now. Please refresh or contact admin."); setLeads([]); return; }
    let rows = data || [];
    // Agents: show only leads actually assigned to or created by them (RLS also returns the open pool — exclude that here).
    if (isAgent && au) rows = rows.filter((l) => l.assigned_agent === au.id || l.current_owner === au.id || l.created_by === au.id);
    setLeads(rows);
    if (!isAgent) {
      try { const { data: ag } = await supabase.from("profiles").select("id, full_name, role, active").order("full_name"); setAgents(ag || []); } catch (e) {}
    }
  };
  useEffect(() => { load(); }, []);

  const today = dubaiToday();
  const fmtDubai = (ts) => { if (!ts) return "—"; try { const s = new Date(ts).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }); return s.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase()); } catch (e) { return "—"; } };
  const fmtDay = (d) => { if (!d) return "—"; try { return new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "numeric" }); } catch (e) { return String(d); } };
  const agentName = (id) => { const a = agents.find((x) => x.id === id); return a ? a.full_name : null; };
  const assignable = agents.filter((a) => a.active !== false && (a.role === "agent" || a.role === "sales_manager"));
  const matchAgentFilter = (l) => {
    if (isAgent || !agentFilter) return true;
    if (agentFilter === "unassigned") return !l.assigned_agent && !l.is_open;
    if (agentFilter === "open") return l.is_open === true;
    return l.assigned_agent === agentFilter;
  };
  const sortCmp = (a, b) => {
    const t = (x) => x.created_at || x.created_on || "";
    switch (sort) {
      case "oldest": return t(a).localeCompare(t(b));
      case "agent": return (a.assigned_agent_name || "~~~").localeCompare(b.assigned_agent_name || "~~~");
      case "status": return (a.status || "").localeCompare(b.status || "");
      case "temp": { const o = { "Very Hot": 0, Hot: 1, Warm: 2, Cold: 3 }; return ((o[a.temperature] ?? 9) - (o[b.temperature] ?? 9)); }
      case "source": return (a.source || "~~~").localeCompare(b.source || "~~~");
      case "project": return (a.project || "~~~").localeCompare(b.project || "~~~");
      case "area": return (a.area || "~~~").localeCompare(b.area || "~~~");
      case "lastcontact": return (b.last_contacted || "").localeCompare(a.last_contacted || "");
      case "nextfu": return (a.next_followup || "9999-99-99").localeCompare(b.next_followup || "9999-99-99");
      case "newest": default: return t(b).localeCompare(t(a));
    }
  };
  const SORTS = [["newest", "Newest first"], ["oldest", "Oldest first"], ["agent", "Assigned agent"], ["status", "Status"], ["temp", "Temperature"], ["source", "Source"], ["project", "Project"], ["area", "Area"], ["lastcontact", "Last contact"], ["nextfu", "Next follow-up"]];
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
  const tabDef = (t, l) => {
    switch (t) {
      case "all": return true;
      case "Follow-up due": return l.next_followup && l.next_followup <= today && l.status !== "Closed Won" && l.status !== "Closed Lost";
      case "Overdue": return l.next_followup && l.next_followup < today && l.status !== "Closed Won" && l.status !== "Closed Lost";
      case "Hot": case "Very Hot": case "Warm": case "Cold": return l.temperature === t;
      default: return l.status === t;
    }
  };
  const matchTab = (l) => tabDef(tab, l);
  const baseLeads = (leads || []).filter(matchFilter).filter(matchAgentFilter);
  const tabCount = (t) => baseLeads.filter((l) => tabDef(t, l)).length;
  const TAB_TONE = { Hot: T.bad, "Very Hot": T.bad, Warm: T.warn, Cold: T.muted, "Closed Won": T.ok, "Closed Lost": T.bad, Overdue: T.bad, "Follow-up due": T.gold, New: T.gold };
  const filteredRaw = (leads || []).filter(matchFilter).filter(matchTab).filter(matchAgentFilter).filter((l) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [l.client_name, l.project, l.area, l.assigned_agent_name, l.lead_code, l.status].some((v) => (v || "").toLowerCase().includes(s));
  });
  const filtered = isAgent ? filteredRaw : [...filteredRaw].sort(sortCmp);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };
  const selIds = Object.keys(selected).filter((k) => selected[k]);
  const toggleSel = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const allVisibleSelected = filtered.length > 0 && filtered.every((l) => selected[l.id]);
  const toggleSelAll = () => { if (allVisibleSelected) { setSelected({}); } else { const n = {}; filtered.forEach((l) => { n[l.id] = true; }); setSelected(n); } };
  const clearSel = () => setSelected({});
  const runBulk = async ({ mode, agentId, reason }) => {
    const ids = selIds; if (!ids.length) return;
    const sel = (leads || []).filter((l) => selected[l.id]);
    const nowIso = new Date().toISOString();
    let shared = {}, toName = null;
    if (mode === "assign") { toName = agentName(agentId); shared = { assigned_agent: agentId, assigned_agent_name: toName, current_owner: agentId, assigned_at: nowIso, is_open: false, opened_reason: null, opened_by: null, opened_at: null }; }
    else if (mode === "open") { shared = { is_open: true, assigned_agent: null, assigned_agent_name: null, current_owner: null, opened_reason: reason || "Lead redistribution", opened_by: me?.id || null, opened_at: nowIso }; }
    else { shared = { is_open: false, assigned_agent: null, assigned_agent_name: null, current_owner: null }; }
    try {
      const { error } = await supabase.from("leads").update(shared).in("id", ids);
      if (error) throw error;
      if (mode === "open") { for (const l of sel.filter((x) => !x.original_agent && x.assigned_agent)) { try { await supabase.from("leads").update({ original_agent: l.assigned_agent }).eq("id", l.id); } catch (e) {} } }
      try {
        const hist = sel.map((l) => ({ lead_id: l.id, from_agent: l.assigned_agent || null, to_agent: mode === "assign" ? agentId : null, reason: reason || (mode === "open" ? "Moved to Open Leads" : mode === "unassign" ? "Unassigned" : "Bulk reassignment"), changed_by: me?.id || null }));
        if (hist.length) await supabase.from("lead_ownership_history").insert(hist);
      } catch (e) {}
      if (mode === "assign" && agentId) { try { await supabase.from("notifications").insert({ user_id: agentId, kind: "lead_assigned", title: ids.length + (ids.length === 1 ? " lead assigned to you" : " leads assigned to you"), body: "You have " + ids.length + " newly assigned " + (ids.length === 1 ? "lead" : "leads") + (reason ? " — " + reason : ""), link_screen: "live" }); } catch (e) {} }
      try {
        await supabase.from("admin_audit").insert({ action: mode === "assign" ? "leads_bulk_assigned" : mode === "open" ? "leads_bulk_opened" : "leads_bulk_unassigned", performed_by: me?.id || null, new_value: { count: ids.length, to: toName, mode, reason: reason || null }, detail: ids.length + (mode === "assign" ? " → " + (toName || "agent") : mode === "open" ? " → Open Leads" : " → Unassigned") });
        const per = sel.map((l) => ({ action: "lead_assigned", performed_by: me?.id || null, affected_user: mode === "assign" ? agentId : null, old_value: { agent: l.assigned_agent_name || null }, new_value: { mode, to: toName }, detail: (l.lead_code || l.client_name || "lead") }));
        if (per.length) await supabase.from("admin_audit").insert(per);
      } catch (e) {}
      setShowBulk(false); clearSel(); await load();
      flash(mode === "assign" ? ids.length + " leads assigned to " + (toName || "agent") : mode === "open" ? ids.length + " leads moved to Open Leads" : ids.length + " leads set to unassigned");
    } catch (e) { setShowBulk(false); flash("Bulk action failed: " + (e.message || "please try again")); }
  };

  return <div>
    {heading && (<div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 19 }}>{heading}</div>
      {sub && <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, lineHeight: 1.5, maxWidth: 760 }}>{sub}</div>}
    </div>)}
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

    {!isAgent && <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>Sort</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ border: `1px solid ${T.hair}`, borderRadius: 9, padding: "7px 10px", fontSize: 12.5, fontFamily: UI, color: T.ink, background: T.paper, cursor: "pointer" }}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>Agent</span>
        <select value={agentFilter || ""} onChange={(e) => setAgentFilter(e.target.value || null)} style={{ border: `1px solid ${agentFilter ? T.gold : T.hair}`, borderRadius: 9, padding: "7px 10px", fontSize: 12.5, fontFamily: UI, color: T.ink, background: T.paper, cursor: "pointer", maxWidth: 210 }}>
          <option value="">All agents</option>
          <option value="unassigned">Unassigned</option>
          <option value="open">Open leads</option>
          <optgroup label="Agents">{assignable.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}</optgroup>
        </select>
      </div>
      {agentFilter && <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.goldSoft, color: T.gold, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700 }}>
        Showing: {agentFilter === "unassigned" ? "Unassigned leads" : agentFilter === "open" ? "Open leads" : ("leads assigned to " + (agentName(agentFilter) || "agent"))}
        <button onClick={() => setAgentFilter(null)} title="Clear filter" style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", padding: 0, display: "grid" }}><X size={13} /></button>
      </span>}
    </div>}

    {!isAgent && selIds.length > 0 && (
      <div style={{ ...card, padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: T.ink, color: "#fff", borderColor: T.ink }}>
        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{selIds.length} selected</span>
        <button onClick={() => setShowBulk(true)} style={{ background: T.gold, color: "#1a1205", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 6 }}><UserPlus size={14} /> Assign to agent</button>
        <button onClick={clearSel} style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Clear</button>
      </div>
    )}

    {/* filter chips */}
    <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
      {TABS.map((t) => {
        const on = tab === t;
        const tone = t === "all" ? T.gold : (TAB_TONE[t] || T.gold);
        const n = tabCount(t);
        return (
          <button key={t} onClick={() => setTab(t)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7,
            border: `1px solid ${on ? tone : T.hair}`, background: on ? tone : T.paper, color: on ? "#fff" : T.inkSoft,
            borderRadius: 999, padding: "7px 11px 7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI,
            boxShadow: on ? T.shadow : "none", transition: "all .15s ease", whiteSpace: "nowrap" }}>
            {t === "all" ? "All" : t}
            <span style={{ fontSize: 11, fontWeight: 800, minWidth: 18, textAlign: "center", borderRadius: 999, padding: "1px 6px",
              background: on ? "rgba(255,255,255,.24)" : T.bone, color: on ? "#fff" : (n ? tone : T.faint) }}>{n}</span>
          </button>
        );
      })}
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
          <div style={{ minWidth: isAgent ? 820 : 2240 }}>
            <div style={{ display: "grid", gridTemplateColumns: isAgent ? "1.5fr 1.3fr 1fr 1.2fr 0.9fr 1fr" : "0.35fr 1.5fr 0.7fr 1.2fr 1.1fr 1.1fr 1.3fr 1.1fr 0.9fr 0.9fr 1.1fr 0.85fr 0.85fr 0.95fr 0.95fr 1fr", gap: 8,
              padding: "10px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
              color: T.muted, borderBottom: `1px solid ${T.hair}`, background: T.bone }}>
              {isAgent ? <><span>Client</span><span>Project</span><span>Budget</span><span>Next follow-up</span><span>Status</span><span>Contact</span></>
                       : <><span style={{ display: "grid", placeItems: "center" }}><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelAll} title="Select all visible" style={{ cursor: "pointer", width: 14, height: 14 }} /></span><span>Date</span><span>Code</span><span>Client</span><span>Phone</span><span>WhatsApp</span><span>Email</span><span>Project</span><span>Area</span><span>Source</span><span>Agent</span><span>Status</span><span>Temp</span><span>Last contact</span><span>Next f/u</span><span>Created by</span></>}
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
              <div key={l.id} onClick={() => openLead && openLead(l.id)} style={{ display: "grid", gridTemplateColumns: "0.35fr 1.5fr 0.7fr 1.2fr 1.1fr 1.1fr 1.3fr 1.1fr 0.9fr 0.9fr 1.1fr 0.85fr 0.85fr 0.95fr 0.95fr 1fr",
                gap: 8, alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12, cursor: "pointer", background: selected[l.id] ? T.goldSoft : "transparent" }}>
                <span onClick={(e) => e.stopPropagation()} style={{ display: "grid", placeItems: "center" }}><input type="checkbox" checked={!!selected[l.id]} onChange={() => toggleSel(l.id)} style={{ cursor: "pointer", width: 14, height: 14 }} /></span>
                <span style={{ fontSize: 10.5, color: T.inkSoft, fontWeight: 600, lineHeight: 1.3 }}>{fmtDubai(l.created_at || l.created_on)}</span>
                <span style={{ fontWeight: 700, color: T.gold, fontSize: 10.5 }}>{l.lead_code || (l.lead_no ? "L" + String(l.lead_no).padStart(3, "0") : "—")}</span>
                <span style={{ fontWeight: 600 }}>{l.client_name}</span>
                <span style={{ fontSize: 11.5 }}>{l.phone || <span style={{ color: T.faint }}>—</span>}</span>
                <span style={{ fontSize: 11.5 }}>{l.whatsapp || l.phone || <span style={{ color: T.faint }}>—</span>}</span>
                <span style={{ fontSize: 11.5, color: l.email ? T.inkSoft : T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.email || "No email"}</span>
                <span style={{ color: T.inkSoft }}>{l.project || "—"}</span>
                <span style={{ color: T.inkSoft }}>{l.area || "—"}</span>
                <span style={{ color: T.inkSoft, fontSize: 11 }}>{l.source || "—"}</span>
                <button onClick={(e) => { e.stopPropagation(); if (l.is_open) setAgentFilter("open"); else if (l.assigned_agent) setAgentFilter(l.assigned_agent); else setAgentFilter("unassigned"); }} title="Filter by this agent" style={{ background: "none", border: "none", textAlign: "left", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 12, color: l.is_open ? T.gold : (l.assigned_agent_name ? T.gold : T.faint), fontWeight: l.assigned_agent_name || l.is_open ? 600 : 400 }}>{l.is_open ? "Open" : (l.assigned_agent_name || "Unassigned")}</button>
                <Chip tone={l.is_open ? "gold" : "info"}>{l.is_open ? "Open" : l.status}</Chip>
                <span style={{ fontSize: 11 }}><Chip tone={l.temperature === "Hot" || l.temperature === "Very Hot" ? "bad" : l.temperature === "Warm" ? "warn" : "info"}>{l.temperature || "—"}</Chip></span>
                <span style={{ fontSize: 11, color: T.inkSoft }}>{l.last_contacted ? fmtDay(l.last_contacted) : "—"}</span>
                <span style={{ fontSize: 11, color: l.next_followup && l.next_followup < today ? T.bad : T.inkSoft }}>{l.next_followup ? fmtDay(l.next_followup) : "—"}</span>
                <span style={{ fontSize: 11, color: T.faint }}>{agentName(l.created_by) || "—"}</span>
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
    {showBulk && <BulkAssignModal count={selIds.length} agents={assignable} onClose={() => setShowBulk(false)} onRun={runBulk} />}
    {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", padding: "11px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: T.shadowLg }}>{toast}</div>}
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
    if (error) { try { console.error("Add lead failed:", error); } catch (e) {} setBusy(false); setErr("Couldn't save this lead. Please check the details and try again."); return; }
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
      if (error) { try { console.error("Import failed:", error); } catch (e) {} setErr("Some rows couldn't be imported. Please check the file and try again."); setBusy(false); return; }
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

function HotDealForm({ initial, me, onClose, onSaved }) {
  const PROP_TYPES = ["Apartment", "Villa", "Townhouse", "Penthouse", "Plot", "Commercial", "Other"];
  const blank = { project_name: "", area: "", property_type: "Apartment", bedrooms: "", price: "", deal_summary: "", why_hot: "", contact_note: "", unit_number: "", size_sqft: "", view: "", floor: "", occupancy: "", seller_urgency: "", last_txn: "", market_price: "", expected_roi: "", listing_link: "", expiry_date: "", client_suitability: "", whatsapp_pitch: "" };
  const [f, setF] = useState(initial ? { ...blank, ...initial, expiry_date: initial.expiry_date || "" } : blank);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted, display: "block", marginTop: 11, marginBottom: 5 };
  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 9, padding: "9px 11px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box" };
  const submit = async (asDraft) => {
    setErr("");
    if (!asDraft) {
      for (const [k, label] of [["project_name", "Project name"], ["area", "Location / area"], ["property_type", "Property type"], ["price", "Price"], ["deal_summary", "Deal summary"], ["why_hot", "Why it's a hot deal"]]) {
        if (!String(f[k] || "").trim()) { setErr(label + " is required."); return; }
      }
    } else if (!String(f.project_name || "").trim()) { setErr("Add at least a project name to save a draft."); return; }
    setBusy(true);
    const row = { ...f, status: asDraft ? "Draft" : "Pending Approval" };
    Object.keys(row).forEach((k) => { if (row[k] === "") row[k] = null; });
    try {
      let res;
      if (initial && initial.id) res = await supabase.from("hot_resale_deals").update(row).eq("id", initial.id);
      else { row.agent_id = me.id; row.agent_name = me.name; res = await supabase.from("hot_resale_deals").insert(row); }
      if (res.error) throw res.error;
      try { await supabase.from("admin_audit").insert({ action: initial && initial.id ? "hot_deal_edited" : (asDraft ? "hot_deal_created" : "hot_deal_submitted"), performed_by: me.id, detail: f.project_name }); } catch (e) {}
      setBusy(false); onSaved(asDraft);
    } catch (e) {
      setBusy(false);
      setErr(/permission|protected|allowed/i.test(e.message || "") ? "You can't submit this deal right now." : "Unable to save the deal. Please try again.");
    }
  };
  const Field = ({ k, label, type, opts, area, ph }) => (
    <div><span style={lbl}>{label}</span>
      {opts ? <select value={f[k] || ""} onChange={(e) => set(k, e.target.value)} style={{ ...inp, background: T.paper }}>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : area ? <textarea value={f[k] || ""} onChange={(e) => set(k, e.target.value)} rows={2} placeholder={ph || ""} style={{ ...inp, resize: "vertical" }} />
          : <input type={type || "text"} value={f[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder={ph || ""} style={inp} />}</div>
  );
  return <Modal title={initial && initial.id ? "Edit hot resale deal" : "Post a hot resale deal"} onClose={onClose}>
    <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Your deal goes to an admin for approval before it appears to the team. Posting as <b style={{ color: T.ink }}>{me.name}</b>.</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Field k="project_name" label="Project name *" ph="e.g. Palm Jebel Ali Villas" />
      <Field k="area" label="Location / area *" ph="e.g. Dubai Hills Estate" />
      <Field k="property_type" label="Property type *" opts={PROP_TYPES} />
      <Field k="bedrooms" label="Bedrooms" ph="e.g. 3 BR" />
      <Field k="price" label="Price *" ph="e.g. AED 4.2M" />
      <Field k="expiry_date" label="Expiry date" type="date" />
    </div>
    <Field k="deal_summary" label="Deal summary *" area ph="One or two lines a buyer would care about." />
    <Field k="why_hot" label="Why it's a hot deal *" area ph="Below market? Motivated seller? Rare unit?" />
    <Field k="contact_note" label="Contact / internal note" area ph="Seller contact or internal note (not shown publicly)." />
    <button onClick={() => setMore((m) => !m)} style={{ ...miniBtn(), marginTop: 12, padding: "7px 12px", fontSize: 12 }}>{more ? "− Hide" : "+ Add"} optional details</button>
    {more && <div style={{ marginTop: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field k="unit_number" label="Unit number" />
        <Field k="size_sqft" label="Size (sqft)" />
        <Field k="view" label="View" />
        <Field k="floor" label="Floor" />
        <Field k="occupancy" label="Occupancy" opts={["", "Vacant", "Rented", "Vacant on transfer"]} />
        <Field k="seller_urgency" label="Seller urgency" opts={["", "Low", "Medium", "High", "Distressed"]} />
        <Field k="last_txn" label="Last transaction comp" />
        <Field k="market_price" label="Market price comp" />
        <Field k="expected_roi" label="Expected ROI / yield" />
        <Field k="listing_link" label="External listing link" />
      </div>
      <Field k="client_suitability" label="Client suitability" area ph="Who is this perfect for?" />
      <Field k="whatsapp_pitch" label="WhatsApp pitch text" area ph="Leave blank and the CRM will generate one." />
    </div>}
    {err && <div style={{ color: T.bad, fontSize: 12, fontWeight: 600, marginTop: 12 }}>{err}</div>}
    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
      <button onClick={() => submit(true)} disabled={busy} style={{ ...miniBtn(), flex: "0 0 auto", padding: "11px 16px" }}>Save draft</button>
      <button onClick={() => submit(false)} disabled={busy} style={{ flex: 1, background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 }}>{busy ? "Submitting…" : "Submit for approval"}</button>
    </div>
  </Modal>;
}

function HotDeals({ user, go }) {
  const isAdmin = user && (user.role === "master_admin" || user.role === "admin");
  const me = user;
  const [deals, setDeals] = useState(null);
  const [tab, setTab] = useState(isAdmin ? "pending" : "board");
  const [showForm, setShowForm] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => { const { data } = await supabase.from("hot_resale_deals").select("*").order("created_at", { ascending: false }); setDeals(data || []); };
  useEffect(() => { load(); }, []);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };
  const audit = (action, deal, extra) => { try { supabase.from("admin_audit").insert({ action, performed_by: me.id, detail: (deal && deal.project_name) || null, new_value: extra || null }); } catch (e) {} };

  const all = deals || [];
  const approved = all.filter((d) => d.status === "Approved");
  const mine = all.filter((d) => d.agent_id === me.id);
  const pending = all.filter((d) => d.status === "Pending Approval");

  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch (e) { return ""; } };
  const STATUS_TONE = { Approved: [T.ok, T.okSoft], "Pending Approval": [T.warn, T.warnSoft], Rejected: [T.bad, T.badSoft], "Needs Correction": [T.warn, T.warnSoft], Draft: [T.muted, T.hairSoft], Expired: [T.faint, T.hairSoft], Removed: [T.faint, T.hairSoft] };
  const badge = (s) => { const [c, b] = STATUS_TONE[s] || [T.muted, T.hairSoft]; return <span style={{ fontSize: 10, fontWeight: 700, color: c, background: b, borderRadius: 6, padding: "2px 8px" }}>{s}</span>; };

  const copyPitch = (d) => {
    const txt = d.whatsapp_pitch && d.whatsapp_pitch.trim() ? d.whatsapp_pitch
      : "🔥 Hot Resale — " + d.project_name + ", " + d.area + "\n" + d.property_type + (d.bedrooms ? " · " + d.bedrooms : "") + " · " + d.price + "\n\n" + d.why_hot + "\n\nKeen to know more? Let's talk.";
    try { navigator.clipboard.writeText(txt); } catch (e) {}
    flash("WhatsApp pitch copied"); audit("hot_deal_pitch_copied", d);
  };
  const askAmber = (d) => {
    audit("hot_deal_ask_amber", d);
    window.dispatchEvent(new CustomEvent("amber-open", { detail: { prompt: "Help me pitch this approved hot resale deal: " + d.project_name + " in " + d.area + ", " + d.property_type + (d.bedrooms ? " " + d.bedrooms : "") + ", " + d.price + ". Why it's hot: " + d.why_hot + ". Draft a short WhatsApp message and tell me which of my clients might match." } }));
  };
  const openDetail = (d) => { setDetail(d); setNoteDraft(d.approval_notes || ""); audit("hot_deal_viewed", d); };

  const setStatus = async (d, status) => {
    setBusy(true);
    const upd = { status, approval_notes: noteDraft || null };
    if (status === "Approved") upd.approved_by = me.id;
    const { error } = await supabase.from("hot_resale_deals").update(upd).eq("id", d.id);
    setBusy(false);
    if (error) { flash("Action failed. Please try again."); return; }
    audit("hot_deal_" + status.toLowerCase().replace(/[ /]+/g, "_"), d, { notes: noteDraft || null });
    setDetail(null); load();
    flash(status === "Approved" ? "Approved — team notified" : status === "Rejected" ? "Rejected — agent notified" : status === "Needs Correction" ? "Sent back for correction" : status === "Removed" ? "Removed" : "Updated");
  };
  const toggleFeature = async (d) => { setBusy(true); const { error } = await supabase.from("hot_resale_deals").update({ featured: !d.featured }).eq("id", d.id); setBusy(false); if (!error) { audit(d.featured ? "hot_deal_unfeatured" : "hot_deal_featured", d); const nd = { ...d, featured: !d.featured }; setDetail(nd); load(); flash(nd.featured ? "Featured on dashboard" : "Unfeatured"); } };

  const Card = ({ d, ownerView }) => (
    <div style={{ ...card, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", background: T.goldSoft, borderBottom: `1px solid ${T.hairSoft}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, color: T.ink, lineHeight: 1.2 }}>{d.project_name}</div>
          {d.featured && <Star size={14} color={T.gold} />}
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{d.area} · {d.property_type}{d.bedrooms ? " · " + d.bedrooms : ""}</div>
      </div>
      <div style={{ padding: "14px 16px", flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.gold, fontFamily: DISPLAY }}>{d.price}</div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>{d.why_hot}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
          <Av name={d.agent_name || "Agent"} size={20} />
          <span style={{ fontSize: 11.5, color: T.muted }}>Posted by <b style={{ color: T.ink }}>{d.agent_name || "Agent"}</b> · {fmtDate(d.created_at)}</span>
        </div>
        {ownerView && <div style={{ marginTop: 8 }}>{badge(d.status)}{d.status === "Needs Correction" && d.approval_notes && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 5 }}>Note: {d.approval_notes}</div>}</div>}
        {d.expiry_date && <div style={{ fontSize: 11, color: T.faint, marginTop: 8 }}>Expires {fmtDate(d.expiry_date)}</div>}
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.hairSoft}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={() => openDetail(d)} style={{ ...miniBtn(), padding: "7px 11px", fontSize: 11.5 }}><Eye size={12} /> Details</button>
        {ownerView && (d.status === "Needs Correction" || d.status === "Draft") && <button onClick={() => { setEditDeal(d); setShowForm(true); }} style={{ ...miniBtn(), padding: "7px 11px", fontSize: 11.5 }}><Pencil size={12} /> Edit & resubmit</button>}
        {d.status === "Approved" && <>
          <button onClick={() => copyPitch(d)} style={{ ...miniBtn(), padding: "7px 11px", fontSize: 11.5, borderColor: T.ok, color: T.ok }}><MessageCircle size={12} /> Copy pitch</button>
          <button onClick={() => askAmber(d)} style={{ ...miniBtn(), padding: "7px 11px", fontSize: 11.5, borderColor: T.goldEdge, color: T.gold }}><Sparkle size={12} /> Ask Amber</button>
        </>}
      </div>
    </div>
  );

  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 };
  const tabs = isAdmin ? [["pending", "Pending", pending.length], ["board", "Approved", approved.length], ["all", "All deals", all.length]]
    : [["board", "Hot deals", approved.length], ["mine", "My submissions", mine.length]];
  const shown = tab === "pending" ? pending : tab === "mine" ? mine : tab === "all" ? all : approved;

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 23, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 10 }}><Flame size={21} color={T.gold} /> Hot Resale Deals</div>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{isAdmin ? "Review agent submissions and publish approved deals to the team." : "Hot resale opportunities shared across the team. Post your own — an admin approves before it goes live."}</div>
      </div>
      <button onClick={() => { setEditDeal(null); setShowForm(true); }} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "flex", alignItems: "center", gap: 7 }}><Plus size={15} /> Post Hot Deal</button>
    </div>

    <div style={{ display: "flex", gap: 8, margintop: 16, marginTop: 16, flexWrap: "wrap" }}>
      {tabs.map(([k, label, n]) => <button key={k} onClick={() => setTab(k)} style={{ border: `1px solid ${tab === k ? T.gold : T.hair}`, background: tab === k ? T.goldSoft : T.paper, color: tab === k ? T.gold : T.muted, borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>{label}{typeof n === "number" ? " · " + n : ""}</button>)}
    </div>

    <div style={{ marginTop: 16 }}>
      {deals === null ? <div style={{ ...card, padding: 30, textAlign: "center", color: T.muted }}>Loading hot deals…</div>
        : shown.length === 0 ? <div style={{ ...card, padding: 40, textAlign: "center" }}>
            <Flame size={26} color={T.faint} style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700 }}>{tab === "pending" ? "No deals waiting for approval." : tab === "mine" ? "You haven't posted any hot deals yet." : "No approved hot deals yet."}</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>{isAdmin ? "Approved deals appear to the whole team." : "Tap Post Hot Deal to share an opportunity."}</div>
          </div>
        : tab === "pending" ? <div style={{ display: "grid", gap: 10 }}>
            {pending.map((d) => <div key={d.id} style={{ ...card, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d.project_name} <span style={{ color: T.muted, fontWeight: 500 }}>· {d.area} · {d.property_type}{d.bedrooms ? " · " + d.bedrooms : ""}</span></div>
                <div style={{ fontSize: 12.5, color: T.gold, fontWeight: 700, marginTop: 2 }}>{d.price}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>By {d.agent_name || "Agent"} · {fmtDate(d.created_at)}</div>
              </div>
              <button onClick={() => openDetail(d)} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Review</button>
            </div>)}
          </div>
        : <div style={grid}>{shown.map((d) => <Card key={d.id} d={d} ownerView={tab === "mine" || (tab === "all" && isAdmin)} />)}</div>}
    </div>

    {showForm && <HotDealForm initial={editDeal} me={me} onClose={() => { setShowForm(false); setEditDeal(null); }} onSaved={(asDraft) => { setShowForm(false); setEditDeal(null); load(); flash(asDraft ? "Saved as draft" : "Submitted for approval"); if (!isAdmin) setTab(asDraft ? "mine" : "mine"); }} />}

    {detail && <Modal title={detail.project_name} onClose={() => setDetail(null)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>{badge(detail.status)}{detail.featured && <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, background: T.goldSoft, borderRadius: 6, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}><Star size={10} /> Featured</span>}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.gold, fontFamily: DISPLAY, margin: "6px 0" }}>{detail.price}</div>
      <div style={{ fontSize: 12.5, color: T.muted }}>{detail.area} · {detail.property_type}{detail.bedrooms ? " · " + detail.bedrooms : ""}</div>
      {[["Deal summary", detail.deal_summary], ["Why it's hot", detail.why_hot], ["Client suitability", detail.client_suitability], ["Unit", detail.unit_number], ["Size", detail.size_sqft], ["View", detail.view], ["Floor", detail.floor], ["Occupancy", detail.occupancy], ["Seller urgency", detail.seller_urgency], ["Last transaction", detail.last_txn], ["Market price", detail.market_price], ["Expected ROI", detail.expected_roi], ["Expiry", detail.expiry_date ? fmtDate(detail.expiry_date) : null]].filter(([, v]) => v).map(([k, v]) => <div key={k} style={{ marginTop: 10 }}><div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: T.muted }}>{k}</div><div style={{ fontSize: 13, color: T.ink, marginTop: 2, lineHeight: 1.5 }}>{v}</div></div>)}
      {detail.listing_link && <div style={{ marginTop: 10 }}><a href={detail.listing_link} target="_blank" rel="noreferrer" style={{ color: T.gold, fontSize: 12.5, fontWeight: 700 }}>External listing ↗</a></div>}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.hairSoft}` }}>
        <Av name={detail.agent_name || "Agent"} size={22} /><span style={{ fontSize: 12, color: T.muted }}>Posted by <b style={{ color: T.ink }}>{detail.agent_name || "Agent"}</b> · {fmtDate(detail.created_at)}</span>
      </div>
      {(isAdmin || detail.contact_note) && detail.contact_note && <div style={{ marginTop: 10, padding: "10px 12px", background: T.bone, borderRadius: 9, fontSize: 12, color: T.inkSoft }}><b style={{ color: T.ink }}>Internal note:</b> {detail.contact_note}</div>}

      {detail.status === "Approved" && <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button onClick={() => copyPitch(detail)} style={{ ...miniBtn(), padding: "10px 14px", borderColor: T.ok, color: T.ok }}><MessageCircle size={13} /> Copy WhatsApp pitch</button>
        <button onClick={() => askAmber(detail)} style={{ ...miniBtn(), padding: "10px 14px", borderColor: T.goldEdge, color: T.gold }}><Sparkle size={13} /> Ask Amber to pitch this</button>
      </div>}

      {isAdmin && <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.hair}` }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>Admin review</div>
        <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={2} placeholder="Approval / rejection / correction note (shown to the agent)…" style={{ width: "100%", border: `1px solid ${T.hair}`, borderRadius: 9, padding: "9px 11px", fontSize: 12.5, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box", resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {detail.status !== "Approved" && <button onClick={() => setStatus(detail, "Approved")} disabled={busy} style={{ background: T.ok, color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}><Check size={13} /> Approve</button>}
          <button onClick={() => setStatus(detail, "Needs Correction")} disabled={busy} style={{ ...miniBtn(), padding: "10px 14px" }}><RefreshCw size={13} /> Request correction</button>
          <button onClick={() => setStatus(detail, "Rejected")} disabled={busy} style={{ ...miniBtn(), padding: "10px 14px", borderColor: T.badSoft, color: T.bad }}><X size={13} /> Reject</button>
          {detail.status === "Approved" && <button onClick={() => toggleFeature(detail)} disabled={busy} style={{ ...miniBtn(), padding: "10px 14px", borderColor: T.goldEdge, color: T.gold }}><Star size={13} /> {detail.featured ? "Unfeature" : "Feature on dashboard"}</button>}
          {detail.status === "Approved" && <button onClick={() => setStatus(detail, "Removed")} disabled={busy} style={{ ...miniBtn(), padding: "10px 14px" }}>Remove</button>}
        </div>
      </div>}
    </Modal>}

    {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", padding: "11px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: T.shadowLg }}>{toast}</div>}
  </div>;
}


function BulkAssignModal({ count, agents, onClose, onRun }) {
  const REASONS = ["Lead redistribution", "Agent workload balancing", "Agent deactivated", "No response from previous agent", "Client request", "Manager decision", "Other"];
  const [mode, setMode] = useState("assign");
  const [agentId, setAgentId] = useState(agents[0] ? agents[0].id : "");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const toName = (agents.find((a) => a.id === agentId) || {}).full_name || "agent";
  const lbl = { fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6, display: "block", marginTop: 12 };
  const inp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 9, padding: "9px 11px", fontSize: 13, fontFamily: UI, color: T.ink, background: T.paper, boxSizing: "border-box" };
  const summary = mode === "assign" ? "assigning " + count + (count === 1 ? " lead" : " leads") + " to " + toName : mode === "open" ? "moving " + count + (count === 1 ? " lead" : " leads") + " to Open Leads" : "setting " + count + (count === 1 ? " lead" : " leads") + " to unassigned";
  const run = async () => { setBusy(true); await onRun({ mode, agentId: mode === "assign" ? agentId : null, reason }); setBusy(false); };
  return <Modal title="Bulk assign leads" onClose={onClose}>
    {!confirm ? <>
      <div style={{ fontSize: 13, color: T.inkSoft }}><b style={{ color: T.ink }}>{count}</b> {count === 1 ? "lead" : "leads"} selected.</div>
      <span style={lbl}>Action</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[["assign", "Assign to agent"], ["open", "Move to Open Leads"], ["unassign", "Make unassigned"]].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)} style={{ border: `1px solid ${mode === v ? T.gold : T.hair}`, background: mode === v ? T.goldSoft : T.paper, color: mode === v ? T.gold : T.muted, borderRadius: 9, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>{l}</button>
        ))}
      </div>
      {mode === "assign" && <><span style={lbl}>Agent</span>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)} style={inp}>
          {agents.length === 0 ? <option value="">No active agents</option> : agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}{a.role === "sales_manager" ? " (Sales Manager)" : ""}</option>)}
        </select></>}
      <span style={lbl}>Reason / comment {mode === "assign" ? "(optional)" : ""}</span>
      <select value={reason} onChange={(e) => setReason(e.target.value)} style={inp}>
        <option value="">— Select a reason —</option>
        {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button onClick={onClose} style={{ ...miniBtn(), flex: "0 0 auto", padding: "11px 16px" }}>Cancel</button>
        <button onClick={() => { if (mode === "assign" && !agentId) return; setConfirm(true); }} style={{ flex: 1, background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Continue</button>
      </div>
    </> : <>
      <div style={{ ...card, padding: 16, background: T.goldSoft, borderColor: T.goldEdge }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.5 }}>You are {summary}. Continue?</div>
        {reason && <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>Reason: {reason}</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button onClick={() => setConfirm(false)} disabled={busy} style={{ ...miniBtn(), flex: "0 0 auto", padding: "11px 16px" }}>Back</button>
        <button onClick={run} disabled={busy} style={{ flex: 1, background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: busy ? .6 : 1 }}>{busy ? "Working…" : "Confirm"}</button>
      </div>
    </>}
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
      <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Theme</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => setDark(false)} style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${!dark ? T.gold : T.hair}`, background: !dark ? T.goldSoft : T.paper, color: !dark ? T.gold : T.ink, borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: UI }}><Sun size={13} /> Day</button>
        <button onClick={() => setDark(true)} style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${dark ? T.gold : T.hair}`, background: dark ? T.goldSoft : T.paper, color: dark ? T.gold : T.ink, borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: UI }}><Moon size={13} /> Night</button>
      </div>
      <button onClick={() => setModal("password")} style={{ ...miniBtn(), width: "100%", justifyContent: "center", marginTop: 14 }}>
        <Lock size={13} /> Change password</button>
      <div style={{ fontSize: 11, color: T.faint, marginTop: 10, lineHeight: 1.5 }}>
        To update your name, phone, role or team, contact your administrator.</div>
    </Modal>}
    {modal === "settings" && <Modal title="Settings" onClose={() => setModal(null)}>
      <SettingsBlock title="Appearance">
        <div style={{ fontSize: 12.5, marginBottom: 8, color: T.muted }}>Choose your theme</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setDark(false)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${!dark ? T.gold : T.hair}`, background: !dark ? T.goldSoft : T.paper, color: !dark ? T.gold : T.ink, borderRadius: 10, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: UI }}><Sun size={14} /> Day</button>
          <button onClick={() => setDark(true)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${dark ? T.gold : T.hair}`, background: dark ? T.goldSoft : T.paper, color: dark ? T.gold : T.ink, borderRadius: 10, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: UI }}><Moon size={14} /> Night</button>
        </div>
      </SettingsBlock>
      <SettingsBlock title="Install on your phone">
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>Add Amber Homes CRM to your home screen to use it like an app.</div>
        <button onClick={() => { try { if (window.__amberInstall) { window.__amberInstall.prompt(); } else { alert("On iPhone (Safari): tap Share, then 'Add to Home Screen'.\nOn Android (Chrome): open the menu, then 'Install app'."); } } catch (e) {} }} style={{ ...miniBtn(), width: "100%", justifyContent: "center", marginBottom: 12 }}><Download size={13} /> Install app</button>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.ink, marginBottom: 4 }}>iPhone (Safari)</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.6, marginBottom: 10 }}>1. Open the CRM in Safari. 2. Tap the Share icon. 3. Tap "Add to Home Screen". 4. Tap Add. 5. Open Amber Homes CRM from your home screen.</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Android (Chrome)</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.6 }}>1. Open the CRM in Chrome. 2. Tap the menu. 3. Tap "Install app" or "Add to Home screen". 4. Confirm. 5. Open Amber Homes CRM from your home screen.</div>
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
  const [showPw, setShowPw] = useState(false);
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
  return (
    <div className="al-root">
      <style>{LOGIN_CSS}</style>
      <div className="al-bg" aria-hidden="true"><div className="al-stars" /><div className="al-glow al-glowA" /><div className="al-glow al-glowB" /><div className="al-arc" /><div className="al-horizon" /></div>
      <div className="al-wrap al-wrap-solo">
        <div className="al-right">
          <div className="al-card">
            <div className="al-lockcircle"><Lock size={24} /></div>
            <div className="al-stage-head">
              <div className="al-card-title">Set your password</div>
              <div className="al-card-desc">For your security, please choose a new password before continuing.</div>
            </div>
            <label className="al-label">New password</label>
            <div className="al-field">
              <Lock size={16} className="al-field-ic" />
              <input className="al-input al-input-pw" type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
              <button type="button" className="al-eye" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password" tabIndex={-1}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            <label className="al-label">Confirm password</label>
            <div className="al-field">
              <Lock size={16} className="al-field-ic" />
              <input className="al-input" type={showPw ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Re-enter password" onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
            </div>
            {msg && <div className="al-err">{msg}</div>}
            <button className="al-btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save & continue"}</button>
            <div className="al-twofa-row" style={{ justifyContent: "center" }}>
              <button type="button" className="al-link-muted" onClick={signOut}>Sign out instead</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResetPassword({ onDone }) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
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
  return (
    <div className="al-root">
      <style>{LOGIN_CSS}</style>
      <div className="al-bg" aria-hidden="true"><div className="al-stars" /><div className="al-glow al-glowA" /><div className="al-glow al-glowB" /><div className="al-arc" /><div className="al-horizon" /></div>
      <div className="al-wrap al-wrap-solo">
        <div className="al-right">
          <div className="al-card">
            <div className="al-lockcircle"><Lock size={24} /></div>
            {done ? <>
              <div className="al-stage-head">
                <div className="al-card-title">Password updated</div>
                <div className="al-card-desc">Your password has been changed. You can now sign in with your new password.</div>
              </div>
              <button className="al-btn" onClick={onDone}>Go to sign in</button>
            </> : <>
              <div className="al-stage-head">
                <div className="al-card-title">Create a new password</div>
                <div className="al-card-desc">Choose a new password for your Amber Homes account.</div>
              </div>
              <label className="al-label">New password</label>
              <div className="al-field">
                <Lock size={16} className="al-field-ic" />
                <input className="al-input al-input-pw" type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
                <button type="button" className="al-eye" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password" tabIndex={-1}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <label className="al-label">Confirm new password</label>
              <div className="al-field">
                <Lock size={16} className="al-field-ic" />
                <input className="al-input" type={showPw ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Re-enter password" onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
              </div>
              {msg && <div className="al-err">{msg}</div>}
              <button className="al-btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
              <div className="al-twofa-row" style={{ justifyContent: "center" }}>
                <button type="button" className="al-link-muted" onClick={onDone}>← Back to sign in</button>
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
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
