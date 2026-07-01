import { useState, useEffect, useRef, Component } from "react";
import { supabase, roleInfo, allowedFor, canOpen, stampLogin, adminCall, resolveRole, MASTER_ADMIN_EMAIL, logActivityReliable, stampContactedReliable, logDataCallReliable } from "./supabase.js";
import { MENTORS, mentorById, buildCrmContext, classifyInappropriate, isPureGreeting, categorize, logAi, fetchKnowledge, pickKnowledge } from "./mentors.js";
import {
  BookOpen, Pencil, Trash2, Save, Check,
  LayoutDashboard, UserCircle, FileText, UserPlus, Kanban, BarChart3,
  ShieldAlert, Building2, Gauge, Briefcase, Coins, Settings, Menu, X,
  Phone, MessageCircle, Mail, Search, Bell, ChevronRight, ChevronDown,
  Flame, Clock, MapPin, Eye, EyeOff, Lock, AlertTriangle, CheckCircle2,
  TrendingUp, Users, Wallet, Star, Calendar, Filter, Plus, ArrowUpRight,
  ArrowDownRight, CircleDot, Ban, Download, Globe, Smartphone, Sun, Moon, Unlock, Send, Bot, Fingerprint, KeyRound, LogOut,
  Database, RefreshCw, Upload, Sparkle, Zap, ShieldCheck, Camera, Target, PhoneCall, BedDouble, Home, Share2, ThumbsUp, ThumbsDown, Calculator, RotateCcw
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
  /* Lead/list grids: keep every row's columns identical and clip long values to one line. */
  .amber-grid > * { min-width: 0; }
  .amber-grid > *:not(:first-child) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
  /* iPhone PWA standalone only: push the Ask Amber chat header below the status bar/notch and clear the home indicator. Safari (browser) is unaffected, so no extra gap there. */
  @media all and (display-mode: standalone) {
    .amber-chat-header { padding-top: calc(env(safe-area-inset-top) + 13px) !important; }
    .amber-chat-foot { padding-bottom: calc(env(safe-area-inset-bottom) + 11px) !important; }
  }
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
  /* ===== Added themes: Lime / Tidal / Ember (base + accent, day + night). Default = no [data-accent] override = unchanged CRM design. ===== */
  [data-accent="lime"] {
    --ink:#16180F; --inkSoft:#3F4632; --muted:#6E7857; --faint:#A6AE92;
    --bone:#F5F8EC; --paper:#FFFFFF; --hair:#E3E8D3; --hairSoft:#EDF1E0;
    --gold:#46700F; --goldBright:#5C9015; --goldSoft:#E9F4D2; --goldEdge:#D0E1A9; --goldTint:#F4F9E7; --wm:rgba(70,112,15,.06);
    --ok:#10B981; --okSoft:#D1FAE5; --warn:#F59E0B; --warnSoft:#FEF3C7; --bad:#EF4444; --badSoft:#FEE2E2; --info:#0EA5E9; --infoSoft:#E0F2FE;
    --hero:#16180F; --side:#FFFFFF; --btnBg:#16180F; --btnFg:#FFFFFF;
    --shadow:0 1px 2px rgba(22,24,15,.04), 0 6px 18px rgba(22,24,15,.06); --shadowLg:0 2px 4px rgba(22,24,15,.06), 0 16px 40px rgba(22,24,15,.10);
    --sideText:#5B6B47; --sideActiveText:#3A5E08; --sideActiveBg:#E9F4D2; --sideBorder:#E3E8D3; --sideBrand:#16180F;
  }
  [data-amber="dark"][data-accent="lime"] {
    --ink:#FFFFFF; --inkSoft:#C9C9CE; --muted:#9A9AA0; --faint:#5E5E64;
    --bone:#0B0B0D; --paper:#151517; --hair:#262629; --hairSoft:#1D1D20;
    --gold:#C5F82A; --goldBright:#D4FF55; --goldSoft:rgba(197,248,42,.13); --goldEdge:rgba(197,248,42,.32); --goldTint:#15180A; --wm:rgba(197,248,42,.07);
    --ok:#22C55E; --okSoft:#0E2A18; --warn:#F5A524; --warnSoft:#33270C; --bad:#FF5C49; --badSoft:#331613; --info:#38BDF8; --infoSoft:#0C2A3A;
    --hero:#1D1D20; --side:#0B0B0D; --btnBg:#C5F82A; --btnFg:#0B0B0D;
    --shadow:0 2px 8px rgba(0,0,0,.5); --shadowLg:0 10px 34px rgba(0,0,0,.6);
    --sideText:#9A9AA0; --sideActiveText:#0B0B0D; --sideActiveBg:#C5F82A; --sideBorder:#262629; --sideBrand:#C5F82A;
  }
  [data-accent="tidal"] {
    --ink:#11151C; --inkSoft:#3A4453; --muted:#647183; --faint:#9AA6B6;
    --bone:#EEF2F7; --paper:#FFFFFF; --hair:#DBE2EC; --hairSoft:#E8EDF4;
    --gold:#8C631A; --goldBright:#B5832A; --goldSoft:#F3E8CF; --goldEdge:#E3CFA3; --goldTint:#FAF5EA; --wm:rgba(140,99,26,.06);
    --ok:#0EA672; --okSoft:#D1F5E6; --warn:#F59E0B; --warnSoft:#FEF3C7; --bad:#EF4444; --badSoft:#FEE2E2; --info:#0EA5E9; --infoSoft:#E0F2FE;
    --hero:#11151C; --side:#FFFFFF; --btnBg:#11151C; --btnFg:#FFFFFF;
    --shadow:0 1px 2px rgba(17,21,28,.05), 0 6px 18px rgba(17,21,28,.07); --shadowLg:0 2px 4px rgba(17,21,28,.06), 0 16px 40px rgba(17,21,28,.10);
    --sideText:#566273; --sideActiveText:#6F5113; --sideActiveBg:#F3E8CF; --sideBorder:#DBE2EC; --sideBrand:#11151C;
  }
  [data-amber="dark"][data-accent="tidal"] {
    --ink:#EEF2F8; --inkSoft:#C2CCDA; --muted:#94A0B2; --faint:#5A6478;
    --bone:#0F1117; --paper:#181B22; --hair:#2C313C; --hairSoft:#222630;
    --gold:#E7BC66; --goldBright:#F2CE86; --goldSoft:rgba(231,188,102,.14); --goldEdge:rgba(231,188,102,.34); --goldTint:#1A1B16; --wm:rgba(231,188,102,.07);
    --ok:#34D27B; --okSoft:#0E2A1E; --warn:#F5A524; --warnSoft:#33270C; --bad:#FF5C49; --badSoft:#331613; --info:#38BDF8; --infoSoft:#0C2A3A;
    --hero:#222630; --side:#0B0F17; --btnBg:#E7BC66; --btnFg:#0C0F16;
    --shadow:0 2px 8px rgba(0,0,0,.5); --shadowLg:0 10px 34px rgba(0,0,0,.6);
    --sideText:#94A0B2; --sideActiveText:#0C0F16; --sideActiveBg:#E7BC66; --sideBorder:#2C313C; --sideBrand:#E7BC66;
    background:linear-gradient(155deg,#14161B 0%,#0F1722 50%,#0A1422 100%) !important;
  }
  [data-accent="ember"] {
    --ink:#1E140C; --inkSoft:#4A3A2C; --muted:#7E6A55; --faint:#B0A08C;
    --bone:#FBF5EC; --paper:#FFFFFF; --hair:#EBE0D2; --hairSoft:#F3EBDF;
    --gold:#B5470E; --goldBright:#D2560F; --goldSoft:#FBE5D2; --goldEdge:#F0CBA8; --goldTint:#FCF1E7; --wm:rgba(181,71,14,.06);
    --ok:#10B981; --okSoft:#D1FAE5; --warn:#F59E0B; --warnSoft:#FEF3C7; --bad:#EF4444; --badSoft:#FEE2E2; --info:#0EA5E9; --infoSoft:#E0F2FE;
    --hero:#1E140C; --side:#FFFFFF; --btnBg:#1E140C; --btnFg:#FFFFFF;
    --shadow:0 1px 2px rgba(30,20,12,.05), 0 6px 18px rgba(30,20,12,.07); --shadowLg:0 2px 4px rgba(30,20,12,.06), 0 16px 40px rgba(30,20,12,.10);
    --sideText:#6E5B47; --sideActiveText:#9A3D0A; --sideActiveBg:#FBE5D2; --sideBorder:#EBE0D2; --sideBrand:#1E140C;
  }
  [data-amber="dark"][data-accent="ember"] {
    --ink:#FBF3E4; --inkSoft:#D8C6AE; --muted:#B9A488; --faint:#7A6650;
    --bone:#0A0705; --paper:#1A120C; --hair:#3A2A1C; --hairSoft:#251A12;
    --gold:#F4E3C1; --goldBright:#FBEFD6; --goldSoft:rgba(244,227,193,.12); --goldEdge:rgba(244,227,193,.30); --goldTint:#1C140B; --wm:rgba(232,99,26,.10);
    --ok:#22C55E; --okSoft:#0E2A18; --warn:#F5A524; --warnSoft:#33270C; --bad:#FF5C49; --badSoft:#331613; --info:#38BDF8; --infoSoft:#0C2A3A;
    --hero:#251A12; --side:#0A0705; --btnBg:#F4E3C1; --btnFg:#1A0E06;
    --shadow:0 2px 8px rgba(0,0,0,.55); --shadowLg:0 10px 34px rgba(0,0,0,.65);
    --sideText:#B9A488; --sideActiveText:#1A0E06; --sideActiveBg:#F4E3C1; --sideBorder:#3A2A1C; --sideBrand:#F4E3C1;
    background:linear-gradient(165deg,#0A0705 0%,#1C0D04 45%,#7A2E08 100%) !important;
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

// All /api/ai calls go through here so the caller's Supabase session token is attached.
// The serverless function rejects requests without a valid token — this keeps the AI
// endpoint usable only by signed-in staff (no anonymous quota/proxy abuse).
async function callAi(body) {
  let token = null;
  try { token = (await supabase.auth.getSession()).data.session?.access_token || null; } catch (e) {}
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  return fetch("/api/ai", { method: "POST", headers, body: JSON.stringify(body) });
}

// Fetch ALL rows from a table in pages of 1000. Supabase caps a single response at 1000 rows, so a
// list ordered newest-first silently hides everything past the first 1000 once the table grows beyond
// that. This pages with .range() until every row is loaded. Used by the leads list, pipeline and
// dashboards so growing past 1000 leads never hides older records.
async function fetchAllRows(table, columns = "*", orderCol = "created_at", ascending = false) {
  const PAGE = 1000;
  const fetchPage = async (from) => {
    let q = supabase.from(table).select(columns);
    if (orderCol) q = q.order(orderCol, { ascending });
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) throw error;
    return data || [];
  };
  // Get the row count first (head request, no rows) so all pages can be fetched IN PARALLEL instead of
  // one-after-another — this is the main load-time win when there are several thousand rows.
  let total = null;
  try {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
    if (!error && typeof count === "number") total = count;
  } catch (e) {}
  if (total !== null) {
    if (total === 0) return [];
    const offsets = [];
    for (let from = 0; from < total && from < 200000; from += PAGE) offsets.push(from);
    const pages = await Promise.all(offsets.map((o) => fetchPage(o)));
    return pages.flat();
  }
  // Fallback (count unavailable): sequential paging.
  let out = [], from = 0;
  for (;;) {
    const data = await fetchPage(from);
    out = out.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
    if (from >= 200000) break;
  }
  return out;
}
// Log a lead action to the activity trail (RLS: actor must be the signed-in user).
function logAction(action, lead, actorId, extra) {
  if (!actorId) return;
  try { supabase.from("lead_activity").insert({ lead_id: (lead && lead.id) || null, actor_id: actorId, action,
    detail: { client: lead && lead.client_name, lead_code: lead && lead.lead_code, ...(extra || {}) } }).then(() => {}, () => {}); } catch (e) {}
}

// Phone link helpers. tel: MUST keep the leading "+" (international dialling);
// wa.me MUST be digits only (no "+"). UAE local numbers are normalised to +971 when safe.
// The raw stored number is never mutated — these only build href strings.
function normIntl(phone) {
  let d = String(phone || "").trim().replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  const only = d.replace(/\D/g, "");
  if (d.startsWith("+")) return only;                 // already international
  if (/^0\d{9}$/.test(only)) return "971" + only.slice(1);   // 05XXXXXXXX -> 9715XXXXXXXX
  if (/^5\d{8}$/.test(only)) return "971" + only;            // 5XXXXXXXX  -> 9715XXXXXXXX
  return only;                                        // assume already has country code
}
function telHref(phone) { const d = normIntl(phone); return d ? "tel:+" + d : "tel:"; }
function waHref(phone) { const d = normIntl(phone); return "https://wa.me/" + d; }

/* ===================== SMART INTERNATIONAL PHONE INPUT ===================== */
// Curated, broad country set (iso2 + name + dial). Search matches the whole set; the six pinned
// markets surface first, the rest alphabetical. Flags are derived from the ISO code (no asset files).
const COUNTRIES = [
  { iso2: "AE", name: "United Arab Emirates", dial: "971" }, { iso2: "SA", name: "Saudi Arabia", dial: "966" },
  { iso2: "GB", name: "United Kingdom", dial: "44" }, { iso2: "PK", name: "Pakistan", dial: "92" },
  { iso2: "IN", name: "India", dial: "91" }, { iso2: "RU", name: "Russia", dial: "7" },
  { iso2: "AF", name: "Afghanistan", dial: "93" }, { iso2: "AL", name: "Albania", dial: "355" }, { iso2: "DZ", name: "Algeria", dial: "213" },
  { iso2: "AR", name: "Argentina", dial: "54" }, { iso2: "AM", name: "Armenia", dial: "374" }, { iso2: "AU", name: "Australia", dial: "61" },
  { iso2: "AT", name: "Austria", dial: "43" }, { iso2: "AZ", name: "Azerbaijan", dial: "994" }, { iso2: "BH", name: "Bahrain", dial: "973" },
  { iso2: "BD", name: "Bangladesh", dial: "880" }, { iso2: "BY", name: "Belarus", dial: "375" }, { iso2: "BE", name: "Belgium", dial: "32" },
  { iso2: "BJ", name: "Benin", dial: "229" }, { iso2: "BT", name: "Bhutan", dial: "975" }, { iso2: "BO", name: "Bolivia", dial: "591" },
  { iso2: "BA", name: "Bosnia and Herzegovina", dial: "387" }, { iso2: "BR", name: "Brazil", dial: "55" }, { iso2: "BG", name: "Bulgaria", dial: "359" },
  { iso2: "KH", name: "Cambodia", dial: "855" }, { iso2: "CM", name: "Cameroon", dial: "237" }, { iso2: "CA", name: "Canada", dial: "1" },
  { iso2: "CL", name: "Chile", dial: "56" }, { iso2: "CN", name: "China", dial: "86" }, { iso2: "CO", name: "Colombia", dial: "57" },
  { iso2: "CR", name: "Costa Rica", dial: "506" }, { iso2: "HR", name: "Croatia", dial: "385" }, { iso2: "CY", name: "Cyprus", dial: "357" },
  { iso2: "CZ", name: "Czechia", dial: "420" }, { iso2: "DK", name: "Denmark", dial: "45" }, { iso2: "EG", name: "Egypt", dial: "20" },
  { iso2: "EE", name: "Estonia", dial: "372" }, { iso2: "ET", name: "Ethiopia", dial: "251" }, { iso2: "FI", name: "Finland", dial: "358" },
  { iso2: "FR", name: "France", dial: "33" }, { iso2: "GE", name: "Georgia", dial: "995" }, { iso2: "DE", name: "Germany", dial: "49" },
  { iso2: "GH", name: "Ghana", dial: "233" }, { iso2: "GR", name: "Greece", dial: "30" }, { iso2: "HK", name: "Hong Kong", dial: "852" },
  { iso2: "HU", name: "Hungary", dial: "36" }, { iso2: "IS", name: "Iceland", dial: "354" }, { iso2: "ID", name: "Indonesia", dial: "62" },
  { iso2: "IQ", name: "Iraq", dial: "964" }, { iso2: "IE", name: "Ireland", dial: "353" }, { iso2: "IL", name: "Israel", dial: "972" },
  { iso2: "IT", name: "Italy", dial: "39" }, { iso2: "JP", name: "Japan", dial: "81" }, { iso2: "JO", name: "Jordan", dial: "962" },
  { iso2: "KZ", name: "Kazakhstan", dial: "77" }, { iso2: "KE", name: "Kenya", dial: "254" }, { iso2: "KW", name: "Kuwait", dial: "965" },
  { iso2: "KG", name: "Kyrgyzstan", dial: "996" }, { iso2: "LV", name: "Latvia", dial: "371" }, { iso2: "LB", name: "Lebanon", dial: "961" },
  { iso2: "LY", name: "Libya", dial: "218" }, { iso2: "LT", name: "Lithuania", dial: "370" }, { iso2: "LU", name: "Luxembourg", dial: "352" },
  { iso2: "MY", name: "Malaysia", dial: "60" }, { iso2: "MV", name: "Maldives", dial: "960" }, { iso2: "MT", name: "Malta", dial: "356" },
  { iso2: "MU", name: "Mauritius", dial: "230" }, { iso2: "MX", name: "Mexico", dial: "52" }, { iso2: "MD", name: "Moldova", dial: "373" },
  { iso2: "MA", name: "Morocco", dial: "212" }, { iso2: "NP", name: "Nepal", dial: "977" }, { iso2: "NL", name: "Netherlands", dial: "31" },
  { iso2: "NZ", name: "New Zealand", dial: "64" }, { iso2: "NG", name: "Nigeria", dial: "234" }, { iso2: "NO", name: "Norway", dial: "47" },
  { iso2: "OM", name: "Oman", dial: "968" }, { iso2: "PS", name: "Palestine", dial: "970" }, { iso2: "PA", name: "Panama", dial: "507" },
  { iso2: "PH", name: "Philippines", dial: "63" }, { iso2: "PL", name: "Poland", dial: "48" }, { iso2: "PT", name: "Portugal", dial: "351" },
  { iso2: "QA", name: "Qatar", dial: "974" }, { iso2: "RO", name: "Romania", dial: "40" }, { iso2: "RW", name: "Rwanda", dial: "250" },
  { iso2: "SN", name: "Senegal", dial: "221" }, { iso2: "RS", name: "Serbia", dial: "381" }, { iso2: "SG", name: "Singapore", dial: "65" },
  { iso2: "SK", name: "Slovakia", dial: "421" }, { iso2: "SI", name: "Slovenia", dial: "386" }, { iso2: "ZA", name: "South Africa", dial: "27" },
  { iso2: "KR", name: "South Korea", dial: "82" }, { iso2: "ES", name: "Spain", dial: "34" }, { iso2: "LK", name: "Sri Lanka", dial: "94" },
  { iso2: "SD", name: "Sudan", dial: "249" }, { iso2: "SE", name: "Sweden", dial: "46" }, { iso2: "CH", name: "Switzerland", dial: "41" },
  { iso2: "SY", name: "Syria", dial: "963" }, { iso2: "TW", name: "Taiwan", dial: "886" }, { iso2: "TZ", name: "Tanzania", dial: "255" },
  { iso2: "TH", name: "Thailand", dial: "66" }, { iso2: "TN", name: "Tunisia", dial: "216" }, { iso2: "TR", name: "Turkey", dial: "90" },
  { iso2: "TM", name: "Turkmenistan", dial: "993" }, { iso2: "UG", name: "Uganda", dial: "256" }, { iso2: "UA", name: "Ukraine", dial: "380" },
  { iso2: "US", name: "United States", dial: "1" }, { iso2: "UY", name: "Uruguay", dial: "598" }, { iso2: "UZ", name: "Uzbekistan", dial: "998" },
  { iso2: "VE", name: "Venezuela", dial: "58" }, { iso2: "VN", name: "Vietnam", dial: "84" }, { iso2: "YE", name: "Yemen", dial: "967" },
  { iso2: "ZM", name: "Zambia", dial: "260" }, { iso2: "ZW", name: "Zimbabwe", dial: "263" },
];
const PINNED_ISO = ["AE", "SA", "GB", "PK", "IN", "RU"];
function flagOf(iso2) { try { return String(iso2 || "").toUpperCase().replace(/[A-Z]/g, (c) => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)); } catch (e) { return "🏳"; } }
function dialOf(iso2) { const c = COUNTRIES.find((x) => x.iso2 === iso2); return c ? c.dial : "971"; }
function digitsOnly(s) { return String(s || "").replace(/\D/g, ""); }
// Normalize to E.164. International forms (+… or 00…) are trusted; a bare local number gets one trunk
// zero stripped and the selected country dial code prepended. Matches the documented UAE/PK/UK cases.
function toE164(raw, dial) {
  let s = String(raw || "").trim(); if (!s) return "";
  const compact = s.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) return "+" + digitsOnly(compact);
  let d = digitsOnly(s);
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("0")) d = d.replace(/^0/, "");
  const dc = digitsOnly(dial || "");
  return dc ? "+" + dc + d : (d ? "+" + d : "");
}
// Split a stored E.164 number back into { iso2, dial, national } by longest dial-code prefix.
function parseE164(stored) {
  const e = "+" + digitsOnly(stored);
  if (e === "+") return { iso2: "AE", dial: "971", national: "" };
  let best = null;
  for (const c of COUNTRIES) { const dc = "+" + c.dial; if (e.startsWith(dc) && (!best || dc.length > ("+" + best.dial).length)) best = c; }
  if (!best) return { iso2: "AE", dial: "971", national: digitsOnly(stored) };
  return { iso2: best.iso2, dial: best.dial, national: e.slice(("+" + best.dial).length) };
}
function SmartPhoneInput({ value, onChange, disabled, placeholder }) {
  const init = parseE164(value);
  const [iso, setIso] = useState(init.iso2 || "AE");
  const [nat, setNat] = useState(init.national || "");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);
  useEffect(() => { const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQ(""); } }; document.addEventListener("mousedown", onDoc); return () => document.removeEventListener("mousedown", onDoc); }, []);
  const pick = (c) => { setIso(c.iso2); setOpen(false); setQ(""); onChange(toE164(nat, dialOf(c.iso2))); };
  const onNat = (e) => {
    const raw = e.target.value;
    if (/^\s*(\+|00)/.test(raw)) { const e164 = toE164(raw, dialOf(iso)); const p = parseE164(e164); setIso(p.iso2); setNat(p.national); onChange(e164); return; }
    const cleaned = raw.replace(/[^\d ]/g, ""); setNat(cleaned); onChange(toE164(cleaned, dialOf(iso)));
  };
  const pinned = PINNED_ISO.map((i) => COUNTRIES.find((c) => c.iso2 === i)).filter(Boolean);
  const rest = COUNTRIES.filter((c) => !PINNED_ISO.includes(c.iso2)).sort((a, b) => a.name.localeCompare(b.name));
  const ql = q.trim().toLowerCase();
  const filtered = COUNTRIES.filter((c) => c.name.toLowerCase().includes(ql) || c.dial.includes(ql.replace(/\D/g, "")) || c.iso2.toLowerCase() === ql).sort((a, b) => a.name.localeCompare(b.name));
  const rowList = ql ? filtered : null;
  const rowBtn = { display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: "none", background: "transparent", color: T.ink, padding: "9px 12px", fontSize: 12.8, fontFamily: UI, cursor: "pointer" };
  const Row = (c) => (<button key={c.iso2} type="button" onClick={() => pick(c)} style={rowBtn}><span style={{ fontSize: 15 }}>{flagOf(c.iso2)}</span><span style={{ flex: 1 }}>{c.name}</span><span style={{ color: T.muted }}>+{c.dial}</span></button>);
  return (
    <div ref={wrapRef} style={{ position: "relative", display: "flex", gap: 6, marginTop: 5 }}>
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 5, border: `1px solid ${T.hair}`, background: T.bone, color: T.ink, borderRadius: 10, padding: "10px", fontSize: 13, fontFamily: UI, cursor: disabled ? "default" : "pointer", whiteSpace: "nowrap", opacity: disabled ? .6 : 1 }}>
        <span style={{ fontSize: 15 }}>{flagOf(iso)}</span><span style={{ color: T.muted }}>+{dialOf(iso)}</span><span style={{ color: T.muted, fontSize: 10 }}>▾</span>
      </button>
      <input value={nat} onChange={onNat} disabled={disabled} placeholder={placeholder || "Phone number"} inputMode="tel"
        style={{ flex: 1, border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, opacity: disabled ? .6 : 1, boxSizing: "border-box" }} />
      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 60, width: "min(330px, 86vw)", background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 12, boxShadow: T.shadow, overflow: "hidden" }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${T.hair}` }}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search country or code…" style={{ width: "100%", border: `1px solid ${T.hair}`, borderRadius: 9, padding: "8px 10px", fontSize: 12.5, fontFamily: UI, outline: "none", color: T.ink, background: T.bone, boxSizing: "border-box" }} />
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {rowList ? (rowList.length ? rowList.map(Row) : <div style={{ padding: "10px 12px", fontSize: 12, color: T.muted }}>No matches</div>)
              : (<>{pinned.map(Row)}<div style={{ height: 1, background: T.hair, margin: "3px 0" }} />{rest.map(Row)}</>)}
          </div>
        </div>
      )}
    </div>
  );
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
  ["myprofile", "My Profile", UserCircle],
  ["assign", "Lead Assignment", UserPlus],
  ["pipeline", "Pipeline Board", Kanban],
  ["open", "Open Leads", Unlock],
  ["performance", "Agent Performance", BarChart3],
  ["security", "Suspicious Activity", ShieldAlert],
  ["devices", "Devices & Sessions", Smartphone],
  ["matching", "Property Matching", Building2],
  ["score", "Investment Score", Gauge],
  ["breakdown", "Breakdown Calculator", Calculator],
  ["careers", "Careers / Hiring", Briefcase],
  ["commission", "Commissions", Coins],
  ["deals", "Deals", Coins],
  ["projects", "Projects", Building2],
  ["hotdeals", "Hot Resale Deals", Flame],
  ["calling", "Data Calling", Phone],
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

// Landing screen for a role (data_calling agents land on the calling worklist).
function homeScreen(role) {
  const h = roleInfo(role).home;
  return h === "agent" ? "agent" : h === "calling" ? "calling" : "admin";
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
        let { data: { session } } = await supabase.auth.getSession();
        if (!session?.user && mounted) {
          // No local session (e.g. iOS/Safari wiped app storage). Try a silent restore from the
          // HttpOnly trust cookie — no password, no 2FA — before falling back to the login screen.
          try {
            const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 5000);
            const rr = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ action: "rehydrate" }), signal: ctl.signal });
            clearTimeout(to);
            const jj = await rr.json().catch(() => ({}));
            if (jj && jj.ok && jj.token_hash) {
              const { error: vErr } = await supabase.auth.verifyOtp({ token_hash: jj.token_hash, type: "magiclink" });
              if (!vErr) { session = (await supabase.auth.getSession()).data.session; }
            }
          } catch (e) {}
        }
        if (session?.user && mounted) {
          // Sessions no longer force-expire for anyone — they persist and the access token auto-refreshes
          // from the long-lived refresh token. (A first-seen stamp is kept only for the security record.)
          try { if (!localStorage.getItem("amber_login_at")) localStorage.setItem("amber_login_at", String(Date.now())); } catch (e) {}
          const { data: prof } = await supabase.from("profiles").select("full_name, role, active, force_password_change, first_login, password_expires_at, avatar_url").eq("id", session.user.id).single();
          if (prof && prof.active !== false) {
            const role = resolveRole(session.user.email, prof.role);
            const ri = roleInfo(role);
            const expired = !!(prof.password_expires_at && new Date(prof.password_expires_at).getTime() < Date.now());
            setUser({ name: prof.full_name || session.user.email, email: session.user.email, role,
              roleLabel: ri.label, id: session.user.id, avatar_url: prof.avatar_url || null, mustChangePw: !!prof.force_password_change || !!prof.first_login || expired });
            let initial = homeScreen(role);
            try { const saved = sessionStorage.getItem("amber_screen"); if (saved && saved !== "lead" && saved !== "dealdetail" && canOpen(role, saved)) initial = saved; } catch (e) {}
            setScreen(initial);
            stampLogin(session.user.id);
          } else if (prof && prof.active === false) { await supabase.auth.signOut(); }
        }
      }
      if (mounted) setAuthChecked(true);
    })();
    return () => { mounted = false; };
  }, []);
  useEffect(() => { if (user) registerDevice(); }, [user]);   // record device + honor remote/cap sign-out
  const signOut = async () => { clearTrustToken(); try { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ action: "logout" }) }); } catch (e) {} await supabase.auth.signOut(); setUser(null); };
  const [accent, setAccent] = useState("gold");
  const ACCENTS = [["gold", "Default", "#7C5CFA"], ["lime", "Lime", "#C5F82A"],
    ["tidal", "Tidal", "#E7BC66"], ["ember", "Ember", "#E8631A"]];
  // Per-user color theme persistence (localStorage, same approach as the day/night toggle - no DB/RLS change).
  useEffect(() => { if (user && user.id) { try { setAccent(localStorage.getItem("amber_accent_" + user.id) || "gold"); } catch (e) {} } }, [user && user.id]);
  useEffect(() => { if (user && user.id) { try { localStorage.setItem("amber_accent_" + user.id, accent); } catch (e) {} } }, [accent, user && user.id]);
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
  const [leadFrom, setLeadFrom] = useState(null);  // screen a lead was opened from (drives the Back button)
  const [leadSiblings, setLeadSiblings] = useState([]);  // ordered lead IDs of the list it was opened from (drives Prev/Next)
  const go = (s, f = null) => { setScreen(s); setFilter(f); setNavOpen(false); };
  const openLead = (id, siblings) => { setLeadFrom((prev) => (screen === "lead" ? prev : screen)); setDetailId(id); setLeadSiblings(Array.isArray(siblings) ? siblings : []); setScreen("lead"); setFilter(null); setNavOpen(false); try { window.history.pushState({ amberDetail: "lead" }, ""); } catch (e) {} };
  const [dealDetailId, setDealDetailId] = useState(null);
  const openDeal = (id) => { setDealDetailId(id); setScreen("dealdetail"); setNavOpen(false); try { window.history.pushState({ amberDetail: "dealdetail" }, ""); } catch (e) {} };
  const [agentDetailId, setAgentDetailId] = useState(null);
  const openAgent = (id) => { setAgentDetailId(id); setScreen("agentprofile"); setFilter(null); setNavOpen(false); try { window.history.pushState({ amberDetail: "agentprofile" }, ""); } catch (e) {} };
  // Browser / phone BACK button: opening a lead/deal/agent pushes a history entry; pressing back here closes the
  // detail and returns to the list it came from. The list re-reads its saved search/filters/page/scroll on remount,
  // so the previous view is restored without touching the existing CRM "Back" buttons.
  const screenRef = useRef(screen); useEffect(() => { screenRef.current = screen; }, [screen]);
  const leadFromRef = useRef(leadFrom); useEffect(() => { leadFromRef.current = leadFrom; }, [leadFrom]);
  useEffect(() => {
    const onPop = () => {
      const s = screenRef.current;
      if (s === "lead") { setDetailId(null); setFilter(null); setScreen(leadFromRef.current || (user && user.role === "agent" ? "agent" : "live")); }
      else if (s === "dealdetail") { setScreen("deals"); }
      else if (s === "agentprofile") { setScreen("performance"); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [user]);
  // role guard — agents may only open their own surfaces
  useEffect(() => {
    const masterHidden = user && user.role === "master_admin" && (screen === "assign" || screen === "pipeline");
    if (user && (!canOpen(user.role, screen) || masterHidden)) {
      try { console.warn("[access-denied] blocked screen access", { email: user.email, role: user.role, screen, at: new Date().toISOString() }); } catch (e) {}
      setScreen(masterHidden ? "live" : homeScreen(user.role));
    }
  }, [user, screen]);
  // Remember the current top-level screen so a refresh returns here (detail screens need an id, so skip them).
  useEffect(() => {
    if (user && screen !== "lead" && screen !== "dealdetail" && screen !== "agentprofile") { try { sessionStorage.setItem("amber_screen", screen); } catch (e) {} }
  }, [user, screen]);
  const SCREENS = {
    live: <LiveLeads user={user} filter={filter} go={go} openLead={openLead} />, users: <UsersAdmin user={user} openAgent={openAgent} />, admin: <AdminDash go={go} user={user} openLead={openLead} />, agent: <AgentDash go={go} user={user} openLead={openLead} onAvatar={(url) => setUser((u) => (u ? { ...u, avatar_url: url } : u))} />, lead: <LeadDetail leadId={detailId} user={user} go={go} openLead={openLead} from={leadFrom} siblings={leadSiblings} />, open: <LiveLeads user={user} go={go} openLead={openLead} initialAgentFilter="open" heading="Open Leads" sub="Leads currently in the open pool — released by an agent or never assigned. Select one or many and assign them to an active agent. Use the Agent filter to switch between the open pool, unassigned, a specific agent, or everyone." />, kb: <KnowledgeBase user={user} />, projects: <Projects user={user} go={go} />, ailogs: <AiLogs user={user} go={go} />, deals: <Deals user={user} go={go} openDeal={openDeal} openLead={openLead} />, dealdetail: <DealDetail dealId={dealDetailId} user={user} go={go} />, devices: <DevicesSecurity user={user} />, breakdown: <BreakdownCalculator user={user} narrow={narrow} />,
    myprofile: <AgentProfile user={user} agentId={user && user.id} self go={go} openLead={openLead} openAgent={openAgent} onAvatar={(url) => setUser((u) => (u ? { ...u, avatar_url: url } : u))} />, agentprofile: <AgentProfile user={user} agentId={agentDetailId} go={go} openLead={openLead} openAgent={openAgent} />, agents: <AgentsRoster user={user} go={go} openAgent={openAgent} />, targets: <TargetsAdmin user={user} go={go} openAgent={openAgent} />,
    assign: <LiveLeads user={user} go={go} openLead={openLead} initialAgentFilter="unassigned" heading="Lead Assignment" sub="Unassigned leads waiting to be given to an agent. Select one or many, then Assign to agent. Use the Agent filter to view the open pool, a specific agent, or all leads." />, pipeline: <Pipeline go={go} openLead={openLead} />, performance: <AgentPerformance user={user} go={go} openAgent={openAgent} />,
    security: <SecurityLog go={go} />, matching: <Matching go={go} openLead={openLead} />, score: <ScorePage />,
    careers: <Careers />, commission: <Commission />, settings: <SettingsPage />,
    hotdeals: <HotDeals user={user} go={go} />,
    calling: <DataCalling user={user} go={go} narrow={narrow} />,
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
      {!recovery && authChecked && !user && <LoginFlow onLogin={(u) => { try { localStorage.setItem("amber_login_at", String(Date.now())); } catch (e) {} setUser(u); setScreen(u.home === "agent" ? "agent" : "admin"); }} dark={dark} setDark={setDark} />}
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
            {NAV.filter(([k]) => user && canOpen(user.role, k) && !(user.role === "master_admin" && (k === "assign" || k === "pipeline"))).map(([k, label0, Ic]) => {
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
            {SCREENS[screen] || <div style={{ ...card, padding: 30, textAlign: "center", color: T.muted }}>This section isn't available. <button onClick={() => go(homeScreen(user.role))} style={{ ...miniBtn(), marginLeft: 8 }}>Go to dashboard</button></div>}
          </ScreenBoundary>
        </div>
        <AskAmber narrow={narrow} user={user} openLead={openLead} />
        <PushSetup user={user} />
      </main>}
    </div>
  );
}

/* ============================== PRIMITIVES =============================== */
const card = { background: T.paper, border: `1px solid ${T.hairSoft}`, borderRadius: 12, boxShadow: T.shadow, transition: "background .25s ease, border-color .25s ease, box-shadow .25s ease" };

// ---- Premium showcase card + timeframe filtering (reusable for Projects + Hot Resale) ----
function hotImageFrom(photos) {
  try {
    if (Array.isArray(photos) && photos.length) {
      const p = photos[0];
      if (typeof p === "string") return p;
      if (p && typeof p === "object") return p.url || p.src || p.href || null;
    }
  } catch (e) {}
  return null;
}
function isRecent(ts, days) { try { return !!ts && (Date.now() - new Date(ts).getTime()) <= days * 864e5; } catch (e) { return false; } }
function withinFrame(ts, frame) {
  if (frame === "all" || !ts) return true;
  try { return (Date.now() - new Date(ts).getTime()) <= (frame === "week" ? 7 : 31) * 864e5; } catch (e) { return true; }
}
function sortFeaturedNewest(arr) {
  return [...(arr || [])].sort((a, b) => {
    const f = (x) => (x && x.featured ? 1 : 0);
    if (f(b) !== f(a)) return f(b) - f(a);
    const t = (x) => new Date((x && (x.created_at || x.created_on)) || 0).getTime();
    return t(b) - t(a);
  });
}
function FrameTabs({ value, onChange }) {
  const opts = [["week", "This Week"], ["month", "This Month"], ["all", "All"]];
  return (
    <div style={{ display: "inline-flex", background: T.bone, border: `1px solid ${T.hair}`, borderRadius: 999, padding: 3, gap: 2 }}>
      {opts.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} style={{ border: "none", cursor: "pointer", fontFamily: UI, fontSize: 12, fontWeight: 700,
          padding: "6px 13px", borderRadius: 999, background: value === k ? T.btnBg : "transparent", color: value === k ? T.btnFg : T.muted, transition: "background .15s ease" }}>{l}</button>
      ))}
    </div>
  );
}
function HotCard({ img, badge, name, desc, price, paymentPlan, beds, ptype, location, footNote, children, dim }) {
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", opacity: dim ? 0.6 : 1 }}>
      <div style={{ position: "relative", height: 168, flexShrink: 0,
        background: img ? `#0b0716 url("${String(img).replace(/"/g, "%22")}") center/cover no-repeat` : `linear-gradient(135deg, ${T.side} 0%, #15102c 60%, #221634 100%)` }}>
        {!img && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Building2 size={40} color="rgba(255,255,255,.16)" /></div>}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.30) 0%, rgba(0,0,0,0) 34%, rgba(0,0,0,0) 62%, rgba(0,0,0,.22) 100%)" }} />
        {badge && <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(12,9,22,.66)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: ".01em", padding: "5px 11px", borderRadius: 999, border: "1px solid rgba(255,255,255,.16)" }}>{badge}</span>}
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: T.ink, lineHeight: 1.15 }}>{name || "—"}</div>
        {desc && <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</div>}
        {price && <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800, color: T.ink, marginTop: 2 }}>{price}</div>}
        {paymentPlan && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.muted }}><Calendar size={13} color={T.faint} /> <span>Payment Plan: <span style={{ color: T.inkSoft, fontWeight: 600 }}>{paymentPlan}</span></span></div>}
        {(beds || ptype) && <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13, color: T.inkSoft, marginTop: 1 }}>
          {beds && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><BedDouble size={15} color={T.faint} /> {beds}</span>}
          {ptype && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Home size={15} color={T.faint} /> {ptype}</span>}
        </div>}
        {location && <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: T.ink, fontWeight: 600, marginTop: 1 }}><MapPin size={15} color={T.gold} /> {location}</div>}
        {footNote && <div style={{ fontSize: 11, color: T.faint, marginTop: 1 }}>{footNote}</div>}
        {children && <div style={{ marginTop: "auto", paddingTop: 10 }}>{children}</div>}
      </div>
    </div>
  );
}
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
function Av({ name, size = 36, dark, src, round }) {
  const ini = String(name || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
  const radius = round ? "50%" : size * 0.3;
  if (src) return <img src={src} alt={name || ""} style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0, border: `1px solid ${dark ? "rgba(255,255,255,.25)" : T.goldEdge}` }} />;
  return <div style={{ width: size, height: size, borderRadius: radius, background: dark ? T.hero : T.goldSoft,
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
function BackupExport({ user }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  if (!user || user.role !== "master_admin") return null;
  const dl = (name, text, type) => {
    const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };
  const csv = (rows) => {
    if (!rows || !rows.length) return "";
    const cols = Object.keys(rows[0]);
    const cell = (v) => (v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v))).replace(/"/g, '""');
    return cols.join(",") + "\n" + rows.map((r) => cols.map((c) => '"' + cell(r[c]) + '"').join(",")).join("\n");
  };
  const fetchAll = async (table) => {
    let out = [], from = 0;
    for (;;) {
      const { data, error } = await supabase.from(table).select("*").range(from, from + 999);
      if (error) throw error;
      out = out.concat(data || []);
      if (!data || data.length < 1000) break;
      from += 1000;
    }
    return out;
  };
  const logExport = (what, n) => { try { supabase.from("admin_audit").insert({ action: "data_export", performed_by: user.id, detail: what, new_value: { rows: n } }); } catch (e) {} };
  const run = async (key) => {
    setBusy(key); setMsg("");
    try {
      const ts = new Date().toISOString().slice(0, 10);
      if (key === "leads") { const r = await fetchAll("leads"); dl("amber-leads-" + ts + ".csv", csv(r), "text/csv"); logExport("leads_csv", r.length); setMsg("Exported " + r.length + " leads (CSV)."); }
      else if (key === "deals") { const r = await fetchAll("deals"); dl("amber-deals-" + ts + ".csv", csv(r), "text/csv"); logExport("deals_csv", r.length); setMsg("Exported " + r.length + " deals (CSV)."); }
      else if (key === "activity") { const r = await fetchAll("lead_activity"); dl("amber-activity-" + ts + ".csv", csv(r), "text/csv"); logExport("activity_csv", r.length); setMsg("Exported " + r.length + " activity rows (CSV)."); }
      else if (key === "kb") { const r = await fetchAll("ai_knowledge"); dl("amber-knowledge-" + ts + ".json", JSON.stringify(r, null, 2), "application/json"); logExport("knowledge_json", r.length); setMsg("Exported " + r.length + " knowledge entries (JSON)."); }
      else if (key === "founder") { const all = await fetchAll("ai_knowledge"); const r = all.filter((x) => /founder/i.test(x.category || "")); dl("amber-founders-knowledge-" + ts + ".json", JSON.stringify(r, null, 2), "application/json"); logExport("founder_json", r.length); setMsg("Exported " + r.length + " Founder's Knowledge entries (JSON)."); }
      else if (key === "all") {
        const tables = ["profiles", "leads", "lead_activity", "lead_comments", "lead_ownership_history", "follow_ups", "lead_reveals", "security_alerts", "open_leads_settings", "app_settings", "deals", "deal_activity", "hot_resale_deals", "projects", "project_files", "ai_knowledge", "ai_sources", "notifications", "admin_audit"];
        const dump = {}; let total = 0;
        for (const t of tables) { try { const r = await fetchAll(t); dump[t] = r; total += r.length; } catch (e) { dump[t] = { error: String((e && e.message) || e) }; } }
        dump._manifest = { created_at: new Date().toISOString(), tables: Object.fromEntries(tables.map((t) => [t, Array.isArray(dump[t]) ? dump[t].length : "error"])) };
        dl("amber-crm-full-backup-" + ts + ".json", JSON.stringify(dump), "application/json"); logExport("full_json", total); setMsg("Exported " + total + " rows across " + tables.length + " tables (JSON).");
      }
    } catch (e) { setMsg("Export failed: " + ((e && e.message) || "error") + ". Please try again."); }
    setBusy("");
  };
  const BTNS = [["leads", "Leads (CSV)"], ["deals", "Deals (CSV)"], ["activity", "Activity log (CSV)"], ["kb", "Knowledge base (JSON)"], ["founder", "Founder's Knowledge (JSON)"], ["all", "Everything (JSON)"]];
  return (
    <div style={{ ...card, padding: 18, marginTop: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Backup / Export <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 700 }}>· Master Admin only</span></div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>Download a snapshot of CRM data. Files contain private client data — store them in a secure, private location and never share publicly. Every export is logged.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {BTNS.map(([k, lbl]) => (
          <button key={k} onClick={() => run(k)} disabled={!!busy} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold, opacity: busy && busy !== k ? 0.5 : 1 }}>{busy === k ? "Exporting…" : lbl}</button>
        ))}
      </div>
      {msg ? <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 10, fontWeight: 600 }}>{msg}</div> : null}
    </div>
  );
}

function DuplicateLeads({ user, openLead }) {
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState(null); // null = not scanned yet
  const [err, setErr] = useState("");
  if (!user || user.role !== "master_admin") return null; // needs full-table read (master via RLS)
  const scan = async () => {
    setBusy(true); setErr(""); setGroups(null);
    try {
      const { data, error } = await supabase.rpc("find_duplicate_leads");
      if (error) throw error;
      const byKey = {};
      (data || []).forEach((r) => {
        const k = r.kind + "|" + r.group_key;
        (byKey[k] = byKey[k] || { key: r.group_key, kind: r.kind, leads: [] }).leads.push({ id: r.lead_id, client_name: r.client_name, phone: r.phone, email: r.email, assigned_agent_name: r.assigned_agent_name, status: r.status, temperature: r.temperature, is_open: r.is_open, created_at: r.created_at });
      });
      const clusters = Object.values(byKey).map((g) => {
        const seen = new Set(); const uniq = g.leads.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
        const agents = Array.from(new Set(uniq.map((l) => (l.assigned_agent_name || "").trim()).filter(Boolean)));
        return { ...g, leads: uniq, agents, crossAgent: agents.length > 1 };
      }).filter((g) => g.leads.length > 1);
      clusters.sort((a, b) => (Number(b.crossAgent) - Number(a.crossAgent)) || b.leads.length - a.leads.length);
      setGroups(clusters);
    } catch (e) { setErr("Couldn't scan leads. Please try again."); }
    setBusy(false);
  };
  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };
  return (<>
    <SectionTitle>Duplicate leads <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 600 }}>· same phone or email</span></SectionTitle>
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={scan} disabled={busy} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold, opacity: busy ? 0.5 : 1 }}>{busy ? "Scanning…" : "Scan for duplicates"}</button>
        <span style={{ fontSize: 11.5, color: T.muted }}>Read-only — finds leads sharing a phone or email so you can review and clean them up.</span>
      </div>
      {err && <div style={{ marginTop: 10, fontSize: 12.5, color: T.bad }}>{err}</div>}
      {groups && groups.length === 0 && <div style={{ marginTop: 12, fontSize: 13, color: T.muted, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={16} color={T.ok} /> No duplicate leads found.</div>}
      {groups && groups.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 10 }}>{groups.length} possible duplicate group{groups.length > 1 ? "s" : ""} · {groups.reduce((n, g) => n + g.leads.length, 0)} leads {groups.some((g) => g.crossAgent) ? "· some span different agents" : ""}</div>
          <div style={{ display: "grid", gap: 10 }}>
            {groups.slice(0, 50).map((g, i) => (
              <div key={i} style={{ border: `1px solid ${g.crossAgent ? T.badSoft : T.hair}`, borderRadius: 10, padding: "10px 12px", background: T.bone }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.inkSoft }}>{g.kind === "phone" ? "Phone: " + g.key : "Email: " + g.key}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: T.goldSoft, color: T.gold, borderRadius: 6, padding: "1px 6px" }}>{g.leads.length} leads</span>
                  {g.crossAgent && <span style={{ fontSize: 10, fontWeight: 700, background: T.badSoft, color: T.bad, borderRadius: 6, padding: "1px 6px" }}>{g.agents.length} different agents</span>}
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  {g.leads.map((l) => (
                    <div key={l.id} style={{ fontSize: 12, color: T.inkSoft, display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>{l.client_name || "Unnamed"}</span><span style={{ color: T.faint }}>·</span>
                      <span>{l.assigned_agent_name || (l.is_open ? "Open pool" : "Unassigned")}</span><span style={{ color: T.faint }}>·</span>
                      <span style={{ color: T.muted }}>{l.status || "—"}</span><span style={{ color: T.faint }}>·</span>
                      <span style={{ color: T.faint }}>{fmtDate(l.created_at)}</span>
                      {openLead && <button onClick={() => openLead(l.id)} style={{ ...miniBtn(), padding: "2px 9px", fontSize: 10.5, marginLeft: "auto", borderColor: T.gold, color: T.gold }}>View</button>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {groups.length > 50 && <div style={{ fontSize: 11, color: T.faint, marginTop: 8 }}>Showing the first 50 groups.</div>}
        </div>
      )}
    </div>
  </>);
}

function AdminDash({ go, user, openLead }) {
  const [stats, setStats] = useState(null);
  const [acts, setActs] = useState([]);
  const [profs, setProfs] = useState([]);
  const [err, setErr] = useState("");
  const [deals, setDeals] = useState(null);
  useEffect(() => { (async () => { const { data } = await supabase.from("deals").select("status,deal_type,project,agent_id,property_value,gross_commission,net_commission,final_net,agent_commission,submitted_at,decided_at,created_at,accounts_status,deleted").neq("status", "cancelled").limit(5000); setDeals(data || []); })(); }, []);
  useEffect(() => {
    (async () => {
      try {
        const monthStartIso = new Date(dubaiToday().slice(0, 7) + "-01T00:00:00+04:00").toISOString();   // every activity metric is today/month/10-min, so only this month is needed
        const [sr, ar, pr] = await Promise.all([
          supabase.rpc("admin_dashboard_stats"),
          supabase.from("lead_activity").select("actor_id,action,created_at").gte("created_at", monthStartIso).order("created_at", { ascending: false }).limit(5000),
          supabase.from("profiles").select("id,full_name,role,active").limit(500),
        ]);
        if (sr.error) { setErr("load"); setStats({}); return; }
        setStats(sr.data || {}); setActs(ar.data || []); setProfs(pr.data || []);
      } catch (e) { setErr("load"); setStats({}); }
    })();
  }, []);

  if (err) return <div style={{ ...card, padding: 22, borderColor: T.badSoft }}>
    <div style={{ fontWeight: 700, color: T.bad }}>Unable to load this section.</div>
    <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>Please try again or contact admin.</div></div>;
  if (stats === null) return <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading live data…</div>;

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

  // Lead-derived figures now come pre-aggregated from admin_dashboard_stats() (a single query) instead of
  // pulling every lead to the browser and counting in JS — that fetch was the ~20s dashboard load.
  const S = stats || {};
  const num = (v) => Number(v) || 0;
  const totalLeads = num(S.total);
  const todayNew = num(S.today_new), monthNew = num(S.month_new), quarterNew = num(S.quarter_new), yearNew = num(S.year_new);
  const unassignedN = num(S.unassigned), openPoolN = num(S.open_pool), hotN = num(S.hot), veryHotN = num(S.very_hot);
  const dueTodayN = num(S.due_today), overdueN = num(S.overdue);
  const wonTotalN = num(S.won_total), wonMonthN = num(S.won_month), wonQuarterN = num(S.won_quarter), wonYearN = num(S.won_year);
  const assignedTotal = num(S.assigned_total);
  const avgDealWon = num(S.avg_deal_won), pipelineValue = num(S.pipeline_value);
  const convOverall = assignedTotal ? (wonTotalN / assignedTotal * 100) : 0;
  const convMonth = monthNew ? (wonMonthN / monthNew * 100) : 0;

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

  // team performance: assigned/won/overdue per agent come from the aggregate; calls/WhatsApp/reveals are
  // matched to the agent's account from this month's activity (kept client-side).
  const perf = (S.agents || []).map((g) => {
    const nm = g.nm;
    const acc = profs.find((p) => (p.full_name || "").toLowerCase() === String(nm).toLowerCase());
    const accActs = acc ? acts.filter((x) => x.actor_id === acc.id && inMonth(x.created_at)) : null;
    return { nm, assigned: num(g.assigned), won: num(g.won), conv: num(g.assigned) ? (num(g.won) / num(g.assigned) * 100) : 0,
      hasAcc: !!acc,
      calls: accActs ? accActs.filter((x) => isCall(x.action)).length : null,
      wa: accActs ? accActs.filter((x) => isWa(x.action)).length : null,
      views: accActs ? accActs.filter((x) => isView(x.action)).length : null,
      overdue: num(g.overdue) };
  }).sort((a, b) => b.assigned - a.assigned);

  const bySource = (S.sources || []).map((x) => [x.s, num(x.n)]);
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
  // Deals that entered the approval pipeline (left draft) — the correct denominator for approval rate.
  const dSubmittedPipeline = D.filter((d) => d.status !== "draft");
  // An approved deal may not have decided_at set; fall back to updated/created so it still counts in a period.
  const apprDate = (d) => d.decided_at || d.updated_at || d.created_at;
  // Net to Amber field name varies (final_net vs net_commission); use whichever is populated.
  const netAmber = (d) => { const v = Number(d.final_net); return Number.isFinite(v) && v > 0 ? v : (Number(d.net_commission) || 0); };
  const sumNet = (arr) => arr.reduce((s, d) => s + netAmber(d), 0);
  const apprMonth = dApproved.filter((d) => inMonth(apprDate(d)));
  const apprQ = dApproved.filter((d) => inQuarter(apprDate(d)));
  const apprYear = dApproved.filter((d) => inYear(apprDate(d)));
  const subToday = D.filter((d) => (d.submitted_at && inToday(d.submitted_at)) || (d.status !== "draft" && inToday(d.created_at)));
  const sumD = (arr, k) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const byType = (t) => dApproved.filter((d) => d.deal_type === t).length;
  const projMap = {}; dApproved.forEach((d) => { if (d.project) projMap[d.project] = (projMap[d.project] || 0) + 1; });
  const topProjects = Object.entries(projMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  // Approved conversion = approved / submitted pipeline (NOT all deals incl. drafts). 1 submitted + 1 approved = 100%.
  const convDeals = dSubmittedPipeline.length ? Math.round(dApproved.length / dSubmittedPipeline.length * 100) : 0;

  return <div>
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.okSoft, color: T.ok,
        borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
        <span style={{ width: 7, height: 7, borderRadius: 7, background: T.ok }} /> LIVE DATA</span>
      <span style={{ fontSize: 12.5, color: T.muted }}>{totalLeads} leads · {acts.length} activity events</span>
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
        <Stat label="Net to Amber · month" value={money(sumNet(apprMonth))} tone="gold" />
        <Stat label="Agent payable · month" value={money(sumD(apprMonth, "agent_commission"))} />
        <Stat label="Sales / Rental" value={byType("Sales") + " / " + byType("Rental")} sub="approved" />
        <Stat label="Approved conversion" value={convDeals + "%"} sub="approved / submitted" />
      </div>
      {topProjects.length > 0 && <div style={{ ...card, padding: 14, marginTop: 10 }}>
        <SectionMini>Approved deals by project</SectionMini>
        {topProjects.map(([p, n]) => <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5, borderBottom: `1px solid ${T.hairSoft}` }}><span style={{ color: T.inkSoft }}>{p}</span><b>{n}</b></div>)}
      </div>}
      <div style={{ fontSize: 11, color: T.faint, marginTop: 8 }}>Only approved deals count as final closed deals; pending deals are shown separately and excluded from totals.</div>
    </div>}

    <SectionTitle>Leads</SectionTitle>
    <div style={grid}>
      <Stat label="Today" value={todayNew} sub="new" onClick={() => go("live", { type: "all", label: "All leads" })} />
      <Stat label="This month" value={monthNew} sub="new" />
      <Stat label="This quarter" value={quarterNew} sub="new" />
      <Stat label="This year" value={yearNew} sub="new" />
      <Stat label="Total" value={totalLeads} sub="all leads" onClick={() => go("live", { type: "all", label: "All leads" })} />
      <Stat label="Unassigned" value={unassignedN} sub="to assign" onClick={() => go("live", { type: "unassigned", label: "Unassigned leads" })} />
      <Stat label="Open pool" value={openPoolN} tone="gold" onClick={() => go("live", { type: "open", label: "Open pool" })} />
      <Stat label="Hot" value={hotN} tone="bad" onClick={() => go("live", { type: "temp", value: "Hot", label: "Hot leads" })} />
      <Stat label="Very Hot" value={veryHotN} tone="bad" onClick={() => go("live", { type: "temp", value: "Very Hot", label: "Very Hot leads" })} />
      <Stat label="Due today" value={dueTodayN} tone="gold" onClick={() => go("live", { type: "due", label: "Follow-ups due" })} />
      <Stat label="Overdue" value={overdueN} tone="bad" onClick={() => go("live", { type: "overdue", label: "Overdue follow-ups" })} />
    </div>

    <SectionTitle>Deals & commission</SectionTitle>
    <div style={grid}>
      <Stat label="Closed (month)" value={wonMonthN} tone="ok" onClick={() => go("live", { type: "status", value: "Closed Won", label: "Closed Won" })} />
      <Stat label="Closed (quarter)" value={wonQuarterN} tone="ok" />
      <Stat label="Closed (year)" value={wonYearN} tone="ok" />
      <Stat label="Closed (total)" value={wonTotalN} tone="ok" onClick={() => go("live", { type: "status", value: "Closed Won", label: "Closed Won" })} />
      <Stat label="Commission (month)" value={money(sumD(apprMonth, "gross_commission"))} tone="gold" sub="approved deals" />
      <Stat label="Commission (year)" value={money(sumD(apprYear, "gross_commission"))} tone="gold" sub="approved deals" />
      <Stat label="Avg deal value" value={wonTotalN ? money(avgDealWon) : "AED 0"} />
      <Stat label="Pipeline value" value={money(pipelineValue)} />
    </div>

    <SectionTitle>Conversion</SectionTitle>
    <div style={grid}>
      <Stat label="Overall" value={convOverall.toFixed(1) + "%"} sub="won / assigned" tone="gold" />
      <Stat label="This month" value={convMonth.toFixed(1) + "%"} sub="won / new" />
      <Stat label="Won : assigned" value={`${wonTotalN} : ${assignedTotal}`} />
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
    <DuplicateLeads user={user} openLead={openLead} />
    <BackupExport user={user} />
  </div>;
}

/* ============================ 2 AGENT DASHBOARD ========================== */
// ===== Agent Profiles & Performance — real logs only (lead_activity / deals / follow_ups) =====
const apMoney = (n) => "AED " + Math.round(Number(n) || 0).toLocaleString("en-US");
const AP_STAFF_ROLES = ["agent", "sales_manager", "admin", "master_admin"];
const apFmtTime = (t) => t ? new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const apFmtAgo = (t) => { if (!t) return "—"; const m = (Date.now() - new Date(t)) / 6e4; if (m < 1) return "just now"; if (m < 60) return Math.round(m) + "m ago"; if (m < 1440) return Math.round(m / 60) + "h ago"; return new Date(t).toLocaleDateString("en-GB"); };
function ApAvatar({ url, name, size = 64 }) {
  return url
    ? <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `1px solid ${T.hairSoft}`, flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: "50%", background: T.goldSoft, color: T.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: size * 0.4, flexShrink: 0 }}>{String(name || "?").trim().charAt(0).toUpperCase() || "?"}</div>;
}

// ===== Agent Targets — daily / weekly / monthly Call & WhatsApp goals (real logs only) =====
const TARGET_DEFAULTS = { daily_call_target: 20, weekly_call_target: 100, monthly_call_target: 400, daily_whatsapp_target: 30, weekly_whatsapp_target: 150, monthly_whatsapp_target: 600 };
function tgtDubaiDate(ts) { try { return new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); } catch (e) { return ""; } }
function tgtTodayStr() { return tgtDubaiDate(Date.now()); }
function tgtMondayStr() {
  const wd = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Dubai", weekday: "short" });
  const back = ({ Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 })[wd] || 0;
  const parts = tgtTodayStr().split("-").map(Number);
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])); dt.setUTCDate(dt.getUTCDate() - back);
  return dt.toISOString().slice(0, 10);
}
function tgtMonthStartIso() { return tgtTodayStr().slice(0, 7) + "-01T00:00:00+04:00"; }
function tgtInPeriod(ts, period) { const ds = tgtDubaiDate(ts); if (!ds) return false; if (period === "today") return ds === tgtTodayStr(); if (period === "week") return ds >= tgtMondayStr(); return ds.slice(0, 7) === tgtTodayStr().slice(0, 7); }
function tgtCount(acts, action, period) { return (acts || []).filter((a) => a.action === action && tgtInPeriod(a.created_at, period)).length; }
function resolveTargets(df, ov) {
  const D = df || TARGET_DEFAULTS; const paused = !!(ov && ov.is_active === false);
  const pick = (col) => (ov && ov[col] != null ? ov[col] : D[col]);
  const w = (col) => (paused ? null : pick(col));
  return { paused, call: { today: w("daily_call_target"), week: w("weekly_call_target"), month: w("monthly_call_target") },
    whatsapp: { today: w("daily_whatsapp_target"), week: w("weekly_whatsapp_target"), month: w("monthly_whatsapp_target") } };
}
function targetStatus(done, target) {
  if (target == null || target <= 0) return { has: false, pct: 0, remaining: 0, ringColor: T.faint, label: "No Target", badgeBg: T.bone, badgeFg: T.muted, msg: "No target set." };
  const pct = Math.round((done / target) * 100);
  if (done > target) return { has: true, pct, remaining: 0, ringColor: T.gold, label: "Exceeded", badgeBg: T.goldSoft, badgeFg: T.gold, msg: "Exceeded by " + (done - target) + "." };
  if (done === target) return { has: true, pct: 100, remaining: 0, ringColor: T.ok, label: "Achieved", badgeBg: T.okSoft, badgeFg: T.ok, msg: "Target achieved." };
  const remaining = target - done; const behind = pct < 60;
  return { has: true, pct, remaining, ringColor: behind ? T.warn : T.gold, label: behind ? "Behind" : "On Track", badgeBg: behind ? T.warnSoft : T.goldSoft, badgeFg: behind ? T.warn : T.gold, msg: remaining + " more to hit your goal." };
}
function TargetRing({ pct, color, size = 104 }) {
  const stroke = Math.max(8, Math.round(size * 0.094)); const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct || 0)); const off = c * (1 - p / 100); const cx = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={T.hairSoft} strokeWidth={stroke} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={"rotate(-90 " + cx + " " + cx + ")"} style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: Math.round(size * 0.27), fontWeight: 800, color: T.ink, lineHeight: 1 }}>{Math.round(pct || 0)}%</span>
      </div>
    </div>
  );
}
function TargetCard({ title, done, target, unit, onDetails }) {
  const s = targetStatus(done, target);
  return (
    <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 9 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>{title}</div>
      <TargetRing pct={s.pct} color={s.ringColor} />
      <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, color: T.ink }}>{done} / {s.has ? target : "\u2014"} <span style={{ fontSize: 11.5, fontWeight: 600, color: T.muted }}>{unit}</span></div>
      <div style={{ fontSize: 11.5, color: s.badgeFg, fontWeight: 600, minHeight: 16 }}>{s.msg}</div>
      {onDetails && <button onClick={onDetails} style={{ ...miniBtn(), fontSize: 11.5, padding: "5px 16px" }}>Details</button>}
    </div>
  );
}
function TargetDetailsModal({ agentId, agentName, action, period, title, target, openLead, onClose }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { let alive = true; (async () => {
    const { data } = await supabase.from("lead_activity").select("action,created_at,lead_id,detail").eq("actor_id", agentId).eq("action", action).gte("created_at", tgtMonthStartIso()).order("created_at", { ascending: false }).limit(1500);
    if (alive) setRows((data || []).filter((r) => tgtInPeriod(r.created_at, period)));
  })(); return () => { alive = false; }; }, []);
  const done = rows ? rows.length : 0; const s = targetStatus(done, target);
  return <Modal title={title} onClose={onClose}>
    {agentName && <div style={{ fontSize: 12.5, color: T.muted, marginTop: -4, marginBottom: 10 }}>{agentName}</div>}
    <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
      <TargetRing pct={s.pct} color={s.ringColor} size={82} />
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800, color: T.ink }}>{done} / {s.has ? target : "\u2014"}</div>
        <div style={{ fontSize: 12.5, color: s.badgeFg, fontWeight: 600 }}>{s.msg}</div>
      </div>
    </div>
    <div style={{ ...card, padding: 6, maxHeight: 360, overflowY: "auto" }}>
      {rows === null ? <div style={{ padding: 16, color: T.muted, fontSize: 12.5 }}>Loading…</div>
        : rows.length === 0 ? <div style={{ padding: 16, color: T.muted, fontSize: 12.5, textAlign: "center" }}>No {action === "call" ? "calls" : "WhatsApp actions"} recorded for this period.</div>
        : rows.map((r, i) => (
          <div key={i} onClick={() => r.lead_id && openLead && openLead(r.lead_id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderBottom: i < rows.length - 1 ? "1px solid " + T.hairSoft : "none", cursor: r.lead_id && openLead ? "pointer" : "default" }}>
            <span style={{ color: action === "whatsapp" ? WA : T.muted }}>{action === "whatsapp" ? <MessageCircle size={14} /> : <PhoneCall size={14} />}</span>
            <span style={{ fontSize: 12.5, color: T.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(r.detail && (r.detail.client || r.detail.lead_code)) || "Lead"}</span>
            <span style={{ fontSize: 11, color: T.faint }}>{new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        ))}
    </div>
  </Modal>;
}
function CommissionTargetCard({ title, icon, earned, target, editable, onEdit }) {
  const has = target != null && Number(target) > 0;
  const pct = has ? Math.round((Number(earned) || 0) / Number(target) * 100) : 0;
  const color = !has ? T.faint : pct >= 100 ? T.ok : pct < 60 ? T.warn : T.gold;
  const aedC = (n) => "AED " + Math.round(Number(n) || 0).toLocaleString("en-US");
  return (
    <div style={{ ...card, padding: "20px 18px 18px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 11 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: T.muted, display: "flex", alignItems: "center", gap: 7 }}>{icon}{title}</div>
      <TargetRing pct={Math.min(100, pct)} color={color} size={148} />
      <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 800, color: T.ink }}>{aedC(earned)} <span style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>/ {has ? aedC(target) : "\u2014"}</span></div>
      <div style={{ fontSize: 11.5, color: has ? (pct >= 100 ? T.ok : T.muted) : T.muted, fontWeight: 600, minHeight: 16 }}>{has ? (pct >= 100 ? "Target achieved \ud83c\udf89" : aedC(Number(target) - (Number(earned) || 0)) + " to go") : (editable ? "Tap to set your monthly goal" : "No target set yet")}</div>
      {editable && <button onClick={onEdit} style={{ ...miniBtn(), fontSize: 11.5, padding: "5px 16px" }}>{has ? "Edit target" : "Set target"}</button>}
    </div>
  );
}
function MyTargets({ userId, acts, openLead, selfId }) {
  const [targets, setTargets] = useState(null);
  const [details, setDetails] = useState(null);
  const [companyTarget, setCompanyTarget] = useState(null);
  const [personalTarget, setPersonalTarget] = useState(null);
  const [monthComm, setMonthComm] = useState(0);
  const [editPersonal, setEditPersonal] = useState(false);
  const [personalInput, setPersonalInput] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const canEditPersonal = !!(userId && selfId && userId === selfId);
  const cInp = { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: UI, color: T.ink, background: T.paper, boxSizing: "border-box" };
  useEffect(() => { let alive = true; if (!userId) { return; }
    (async () => {
      const [df, ov] = await Promise.all([
        supabase.from("default_agent_targets").select("*").eq("id", 1).maybeSingle(),
        supabase.from("agent_targets").select("*").eq("agent_id", userId).maybeSingle(),
      ]);
      if (alive) setTargets(resolveTargets(df.data, ov.data));
      try { const ct = await supabase.from("agent_commission_targets").select("monthly_commission_target").eq("agent_id", userId).maybeSingle(); if (alive && ct && !ct.error) setCompanyTarget(ct.data ? ct.data.monthly_commission_target : null); } catch (e) {}
      try { const pt = await supabase.from("agent_personal_targets").select("monthly_commission_target").eq("agent_id", userId).maybeSingle(); if (alive && pt && !pt.error) { const v = pt.data ? pt.data.monthly_commission_target : null; setPersonalTarget(v); setPersonalInput(v == null ? "" : String(v)); } } catch (e) {}
      try { const dl = await supabase.from("deals").select("agent_commission,status,decided_at,created_at").eq("agent_id", userId).eq("status", "approved").limit(2000); if (alive && dl && !dl.error) setMonthComm((dl.data || []).filter((d) => tgtInPeriod(d.decided_at || d.created_at, "month")).reduce((s, d) => s + (Number(d.agent_commission) || 0), 0)); } catch (e) {}
    })();
    return () => { alive = false; };
  }, [userId]);
  const savePersonal = async () => {
    setSavingPersonal(true);
    const n = personalInput === "" ? null : Math.max(0, parseFloat(String(personalInput).replace(/[^0-9.]/g, "")) || 0);
    const { error } = await supabase.from("agent_personal_targets").upsert({ agent_id: userId, monthly_commission_target: n, updated_at: new Date().toISOString() }, { onConflict: "agent_id" });
    setSavingPersonal(false);
    if (!error) { setPersonalTarget(n); setEditPersonal(false); } else { alert("Couldn't save your personal target. Please try again."); }
  };
  if (!targets) return null;
  const cards = [["Daily Calls", "call", "today", "calls"], ["Daily WhatsApp", "whatsapp", "today", "msgs"], ["Weekly Calls", "call", "week", "calls"], ["Weekly WhatsApp", "whatsapp", "week", "msgs"], ["Monthly Calls", "call", "month", "calls"], ["Monthly WhatsApp", "whatsapp", "month", "msgs"]];
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ ...card, padding: "15px 18px 18px", marginBottom: 14 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 9 }}><Wallet size={19} color={T.gold} /> Commission Targets <span style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>· this month</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginTop: 14 }}>
          <CommissionTargetCard title="Company Target" icon={<Building2 size={13} color={T.muted} />} earned={monthComm} target={companyTarget} editable={false} />
          <CommissionTargetCard title="My Personal Target" icon={<Target size={13} color={T.muted} />} earned={monthComm} target={personalTarget} editable={canEditPersonal} onEdit={() => { setPersonalInput(personalTarget == null ? "" : String(personalTarget)); setEditPersonal(true); }} />
        </div>
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 10 }}>Company target is set by your manager. Progress reflects approved/closed deals only — not drafts or pending approvals.</div>
      </div>
      <div style={{ ...card, padding: "15px 18px 18px" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 9 }}><Target size={19} color={T.gold} /> My Targets</div>
        {targets.paused
          ? <div style={{ fontSize: 12.5, color: T.muted, padding: "12px 0 2px" }}>Your targets are currently paused. Speak to your manager.</div>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(178px, 1fr))", gap: 12, marginTop: 12 }}>
              {cards.map((cc) => <TargetCard key={cc[0]} title={cc[0]} done={tgtCount(acts, cc[1], cc[2])} target={targets[cc[1]][cc[2]]} unit={cc[3]} onDetails={() => setDetails({ action: cc[1], period: cc[2], title: cc[0], target: targets[cc[1]][cc[2]] })} />)}
            </div>}
      </div>
      {editPersonal && <Modal title="My Personal Commission Target" onClose={() => setEditPersonal(false)}>
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>Set your own monthly commission goal in AED. Only you can change this; your manager sets the separate company target.</div>
        <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: 6 }}>Monthly personal target (AED)</label>
        <input type="number" min="0" value={personalInput} onChange={(e) => setPersonalInput(e.target.value)} placeholder="e.g. 200000" style={cInp} />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={savePersonal} disabled={savingPersonal} style={{ border: "none", background: T.gold, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10, cursor: savingPersonal ? "default" : "pointer", fontFamily: UI, opacity: savingPersonal ? 0.7 : 1 }}>{savingPersonal ? "Saving\u2026" : "Save target"}</button>
          <button onClick={() => setEditPersonal(false)} style={{ ...miniBtn() }}>Cancel</button>
        </div>
      </Modal>}
      {details && <TargetDetailsModal agentId={userId} action={details.action} period={details.period} title={details.title} target={details.target} openLead={openLead} onClose={() => setDetails(null)} />}
    </div>
  );
}

function TargetsAdmin({ user, go, openAgent }) {
  const isMaster = !!(user && user.role === "master_admin");
  const canView = isMaster || !!(user && (user.role === "admin" || user.role === "sales_manager"));
  const [defs, setDefs] = useState(null);
  const [defEdit, setDefEdit] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [profs, setProfs] = useState([]);
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDef, setSavingDef] = useState(false);
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState(null);
  const [period, setPeriod] = useState("today");
  const [q, setQ] = useState("");
  const [commTargets, setCommTargets] = useState({});
  const [commEdit, setCommEdit] = useState(null);
  const [savingComm, setSavingComm] = useState(false);
  const lbl = brLbl(), inp = brInp();

  useEffect(() => {
    let alive = true;
    if (!canView) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [df, ov, pp, aa] = await Promise.all([
        supabase.from("default_agent_targets").select("*").eq("id", 1).maybeSingle(),
        supabase.from("agent_targets").select("*"),
        supabase.from("profiles").select("id,full_name,role,active,avatar_url").in("role", ["agent", "sales_manager"]).order("full_name", { ascending: true }),
        supabase.from("lead_activity").select("actor_id,action,created_at").gte("created_at", tgtMonthStartIso()).limit(20000),
      ]);
      if (!alive) return;
      const d = df.data || { id: 1, ...TARGET_DEFAULTS };
      setDefs(d); setDefEdit(d);
      const map = {}; (ov.data || []).forEach((r) => { map[r.agent_id] = r; });
      setOverrides(map); setProfs((pp.data || []).filter((p) => p.active !== false)); setActs(aa.data || []);
      try { const ctr = await supabase.from("agent_commission_targets").select("*"); if (!ctr.error) { const cm = {}; (ctr.data || []).forEach((r) => { cm[r.agent_id] = r; }); setCommTargets(cm); } } catch (e) {}
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const saveDefaults = async () => {
    setSavingDef(true); setMsg("");
    const payload = { id: 1, updated_by: user.id };
    ["daily_call_target", "weekly_call_target", "monthly_call_target", "daily_whatsapp_target", "weekly_whatsapp_target", "monthly_whatsapp_target"].forEach((k) => { payload[k] = Math.max(0, parseInt(defEdit[k], 10) || 0); });
    const { error } = await supabase.from("default_agent_targets").upsert(payload, { onConflict: "id" });
    setSavingDef(false); setMsg(error ? "Couldn't save defaults — please try again." : "Defaults saved.");
    if (!error) { setDefs({ ...defs, ...payload }); setTimeout(() => setMsg(""), 2500); }
  };
  const saveAgent = async () => {
    if (!edit) return;
    const f = edit.form; const num = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : Math.max(0, n); };
    const payload = { agent_id: edit.agent.id, is_active: f.is_active !== false, updated_by: user.id, created_by: user.id,
      daily_call_target: num(f.daily_call_target), weekly_call_target: num(f.weekly_call_target), monthly_call_target: num(f.monthly_call_target),
      daily_whatsapp_target: num(f.daily_whatsapp_target), weekly_whatsapp_target: num(f.weekly_whatsapp_target), monthly_whatsapp_target: num(f.monthly_whatsapp_target) };
    const { error } = await supabase.from("agent_targets").upsert(payload, { onConflict: "agent_id" });
    if (error) { alert("Couldn't save this agent's targets. Please try again."); return; }
    setOverrides((m) => ({ ...m, [edit.agent.id]: payload })); setEdit(null);
  };
  const resetAgent = async (agentId) => {
    const { error } = await supabase.from("agent_targets").delete().eq("agent_id", agentId);
    if (!error) setOverrides((m) => { const c = { ...m }; delete c[agentId]; return c; });
  };
  const saveComm = async () => {
    if (!commEdit) return;
    setSavingComm(true);
    const n = (commEdit.val === "" || commEdit.val == null) ? null : Math.max(0, parseFloat(String(commEdit.val).replace(/[^0-9.]/g, "")) || 0);
    const { error } = await supabase.from("agent_commission_targets").upsert({ agent_id: commEdit.agent.id, monthly_commission_target: n, set_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "agent_id" });
    setSavingComm(false);
    if (error) { alert("Couldn't save the commission target. Please try again."); return; }
    setCommTargets((m) => ({ ...m, [commEdit.agent.id]: { agent_id: commEdit.agent.id, monthly_commission_target: n } })); setCommEdit(null);
  };

  if (!canView) return <div style={{ ...card, padding: 22, maxWidth: 520, margin: "8px auto" }}><div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 800, color: T.ink }}>Access denied</div><div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>Targets are managed by the Master Admin.</div></div>;
  if (loading || !defs) return <div style={{ padding: 24, color: T.muted }}>Loading targets…</div>;

  const periodKeyCall = period === "today" ? "daily_call_target" : period === "week" ? "weekly_call_target" : "monthly_call_target";
  const periodKeyWa = period === "today" ? "daily_whatsapp_target" : period === "week" ? "weekly_whatsapp_target" : "monthly_whatsapp_target";
  const rows = profs.filter((p) => !q || String(p.full_name || "").toLowerCase().includes(q.toLowerCase())).map((p) => {
    const eff = resolveTargets(defs, overrides[p.id]);
    const mine = acts.filter((a) => a.actor_id === p.id);
    const calls = tgtCount(mine, "call", period), wa = tgtCount(mine, "whatsapp", period);
    return { p, eff, calls, wa, cT: eff.call[period], wT: eff.whatsapp[period], custom: !!overrides[p.id], paused: eff.paused };
  });
  const hitCalls = rows.filter((r) => r.cT != null && r.calls >= r.cT).length;
  const hitWa = rows.filter((r) => r.wT != null && r.wa >= r.wT).length;
  const defField = (label, k) => <div><label style={lbl}>{label}</label><input type="number" min="0" value={defEdit[k] == null ? "" : defEdit[k]} onChange={(e) => setDefEdit((d) => ({ ...d, [k]: e.target.value }))} style={inp} disabled={!isMaster} /></div>;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <SectionTitle right={<span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{hitCalls}/{rows.length} hit calls · {hitWa}/{rows.length} hit WhatsApp ({period === "today" ? "today" : period === "week" ? "this week" : "this month"})</span>}>Targets</SectionTitle>

      {/* Default targets */}
      <div style={{ ...card, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: T.ink }}>Default targets {isMaster ? "" : "(read-only)"}</div>
          {msg && <span style={{ fontSize: 12, fontWeight: 600, color: msg.startsWith("Defaults saved") ? T.ok : T.bad }}>{msg}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {defField("Daily calls", "daily_call_target")}
          {defField("Weekly calls", "weekly_call_target")}
          {defField("Monthly calls", "monthly_call_target")}
          {defField("Daily WhatsApp", "daily_whatsapp_target")}
          {defField("Weekly WhatsApp", "weekly_whatsapp_target")}
          {defField("Monthly WhatsApp", "monthly_whatsapp_target")}
        </div>
        {isMaster && <div style={{ marginTop: 14 }}><button onClick={saveDefaults} disabled={savingDef} style={{ border: "none", background: T.gold, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10, cursor: savingDef ? "default" : "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 7, opacity: savingDef ? 0.7 : 1 }}><Save size={15} /> {savingDef ? "Saving…" : "Save defaults"}</button></div>}
      </div>

      {/* Team overview */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <SectionTitle>Team targets</SectionTitle>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.faint }} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agent…" style={{ padding: "8px 12px 8px 31px", borderRadius: 9, border: "1px solid " + T.hair, background: T.paper, color: T.ink, fontSize: 12.5, fontFamily: UI }} /></div>
          <div style={{ display: "flex", gap: 5 }}>{[["today", "Today"], ["week", "Week"], ["month", "Month"]].map((pp) => <button key={pp[0]} onClick={() => setPeriod(pp[0])} style={{ border: "1px solid " + (period === pp[0] ? T.gold : T.hair), background: period === pp[0] ? T.goldSoft : T.paper, color: period === pp[0] ? T.gold : T.muted, fontWeight: 600, fontSize: 12, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontFamily: UI }}>{pp[1]}</button>)}</div>
        </div>
      </div>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.3fr 1.3fr 0.9fr auto", gap: 8, padding: "10px 14px", borderBottom: "1px solid " + T.hairSoft, fontSize: 10, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: T.muted }}>
          <span>Agent</span><span>Calls</span><span>WhatsApp</span><span>Status</span><span></span>
        </div>
        {rows.map((r) => {
          const cs = targetStatus(r.calls, r.cT), ws = targetStatus(r.wa, r.wT);
          const worst = !cs.has && !ws.has ? cs : (cs.label === "Behind" || ws.label === "Behind" ? (cs.label === "Behind" ? cs : ws) : (cs.has ? cs : ws));
          return (
            <div key={r.p.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.3fr 1.3fr 0.9fr auto", gap: 8, padding: "11px 14px", borderBottom: "1px solid " + T.hairSoft, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <ApAvatar url={r.p.avatar_url} name={r.p.full_name} size={32} />
                <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.p.full_name || "—"}</div><div style={{ fontSize: 10.5, color: T.faint }}>{roleLabel(r.p.role)}{r.custom ? " · custom" : ""}{r.paused ? " · paused" : ""}{commTargets[r.p.id] && commTargets[r.p.id].monthly_commission_target != null ? " · 🎯 AED " + Math.round(Number(commTargets[r.p.id].monthly_commission_target)).toLocaleString() + "/mo" : ""}</div></div>
              </div>
              <div style={{ fontSize: 12.5, color: T.ink }}><b style={{ fontFamily: DISPLAY, fontSize: 15 }}>{r.calls}</b> / {r.cT == null ? "—" : r.cT} <span style={{ fontSize: 11, color: cs.badgeFg, fontWeight: 700 }}>{cs.has ? cs.pct + "%" : ""}</span></div>
              <div style={{ fontSize: 12.5, color: T.ink }}><b style={{ fontFamily: DISPLAY, fontSize: 15 }}>{r.wa}</b> / {r.wT == null ? "—" : r.wT} <span style={{ fontSize: 11, color: ws.badgeFg, fontWeight: 700 }}>{ws.has ? ws.pct + "%" : ""}</span></div>
              <div><span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: worst.badgeBg, color: worst.badgeFg }}>{worst.label}</span></div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {openAgent && <button onClick={() => openAgent(r.p.id)} style={{ ...miniBtn(), padding: "5px 10px", fontSize: 11 }}>View</button>}
                <button onClick={() => setCommEdit({ agent: r.p, val: (commTargets[r.p.id] && commTargets[r.p.id].monthly_commission_target != null) ? String(commTargets[r.p.id].monthly_commission_target) : "" })} title="Set monthly commission target (AED)" style={{ ...miniBtn(), padding: "5px 9px", fontSize: 11, borderColor: T.gold, color: T.gold }}><Wallet size={12} /></button>
                {isMaster && <button onClick={() => setEdit({ agent: r.p, form: { ...(overrides[r.p.id] || {}), is_active: overrides[r.p.id] ? overrides[r.p.id].is_active !== false : true } })} style={{ ...miniBtn(), padding: "5px 10px", fontSize: 11, borderColor: T.gold, color: T.gold }}>Edit</button>}
                {isMaster && r.custom && <button onClick={() => resetAgent(r.p.id)} title="Reset to default" style={{ ...miniBtn(), padding: "5px 9px", fontSize: 11 }}><RotateCcw size={12} /></button>}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 20, color: T.muted, fontSize: 13, textAlign: "center" }}>No agents match.</div>}
      </div>
      <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8 }}>Counts come from real call / WhatsApp action logs (Dubai time). Blank target = uses the company default. Only the Master Admin can change call/WhatsApp targets; managers can set the commission target.</div>
      {commEdit && <Modal title={"Commission target \u00b7 " + (commEdit.agent.full_name || "Agent")} onClose={() => setCommEdit(null)}>
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>Monthly company commission target (AED) for this agent. Shown on their dashboard as the Company Target ring; progress counts approved deals only.</div>
        <label style={lbl}>Monthly commission target (AED)</label>
        <input type="number" min="0" value={commEdit.val} onChange={(e) => setCommEdit((s) => ({ ...s, val: e.target.value }))} placeholder="e.g. 300000" style={inp} />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={saveComm} disabled={savingComm} style={{ border: "none", background: T.gold, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10, cursor: savingComm ? "default" : "pointer", fontFamily: UI, opacity: savingComm ? 0.7 : 1 }}>{savingComm ? "Saving\u2026" : "Save target"}</button>
          <button onClick={() => setCommEdit(null)} style={{ ...miniBtn() }}>Cancel</button>
        </div>
      </Modal>}

      {edit && <Modal title={"Targets · " + (edit.agent.full_name || "Agent")} onClose={() => setEdit(null)}>
        <div style={{ fontSize: 12, color: T.muted, marginTop: -4, marginBottom: 12 }}>Leave a field blank to use the company default ({defs.daily_call_target}/{defs.weekly_call_target}/{defs.monthly_call_target} calls, {defs.daily_whatsapp_target}/{defs.weekly_whatsapp_target}/{defs.monthly_whatsapp_target} WhatsApp).</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[["Daily calls", "daily_call_target"], ["Weekly calls", "weekly_call_target"], ["Monthly calls", "monthly_call_target"], ["Daily WhatsApp", "daily_whatsapp_target"], ["Weekly WhatsApp", "weekly_whatsapp_target"], ["Monthly WhatsApp", "monthly_whatsapp_target"]].map((ff) => (
            <div key={ff[1]}><label style={lbl}>{ff[0]}</label><input type="number" min="0" value={edit.form[ff[1]] == null ? "" : edit.form[ff[1]]} placeholder={"default"} onChange={(e) => setEdit((s) => ({ ...s, form: { ...s.form, [ff[1]]: e.target.value === "" ? null : e.target.value } }))} style={inp} /></div>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14, cursor: "pointer", fontSize: 13, color: T.ink }}>
          <input type="checkbox" checked={edit.form.is_active !== false} onChange={(e) => setEdit((s) => ({ ...s, form: { ...s.form, is_active: e.target.checked } }))} style={{ width: 16, height: 16 }} /> Targets active for this agent
        </label>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={saveAgent} style={{ border: "none", background: T.gold, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10, cursor: "pointer", fontFamily: UI }}>Save</button>
          <button onClick={() => setEdit(null)} style={{ ...miniBtn() }}>Cancel</button>
        </div>
      </Modal>}
    </div>
  );
}


function AgentProfile({ user, agentId, self, go, openLead, openAgent, onAvatar }) {
  const isOwn = !!(user && agentId && user.id === agentId);
  const canView = isOwn || (user && (user.role === "master_admin" || user.role === "admin"));
  const editable = isOwn || (user && user.role === "master_admin");
  const [prof, setProf] = useState(null);
  const [ap, setAp] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [acts, setActs] = useState([]);
  const [deals, setDeals] = useState([]);
  const [fups, setFups] = useState([]);
  const [leads, setLeads] = useState([]);
  const [devices, setDevices] = useState([]);
  const [targets, setTargets] = useState(null);
  const [tDetails, setTDetails] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [tab, setTab] = useState("overview");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [upBusy, setUpBusy] = useState(false);
  const [upErr, setUpErr] = useState("");
  const lbl = brLbl(), inp = brInp();

  useEffect(() => {
    let alive = true;
    if (!agentId || !canView) { setLoading(false); return; }
    (async () => {
      setLoading(true); setTab("overview"); setSaveMsg("");
      const d = new Date();
      const monthIso = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const [p, a, ac, dl, fu, ld, dv, tdf, tov] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,role,active,last_login,avatar_url").eq("id", agentId).single(),
        supabase.from("agent_profiles").select("*").eq("user_id", agentId).maybeSingle(),
        supabase.from("lead_activity").select("action,created_at,lead_id,detail").eq("actor_id", agentId).gte("created_at", monthIso).order("created_at", { ascending: false }).limit(4000),
        supabase.from("deals").select("status,project,client_name,property_type,property_value,gross_commission,net_commission,company_share,final_net,submitted_at,decided_at,created_at,deleted").eq("agent_id", agentId).neq("status", "cancelled").limit(2000),
        supabase.from("follow_ups").select("status,due_at,completed_at,created_at").eq("agent_id", agentId).limit(3000),
        supabase.from("leads").select("temperature,created_at,last_contacted").eq("assigned_agent", agentId).limit(4000),
        supabase.from("user_devices").select("last_seen,revoked").eq("user_id", agentId).limit(20),
        supabase.from("default_agent_targets").select("*").eq("id", 1).maybeSingle(),
        supabase.from("agent_targets").select("*").eq("agent_id", agentId).maybeSingle(),
      ]);
      if (!alive) return;
      setProf(p.data || null);
      setAp(a.data || { user_id: agentId });
      setAvatarUrl((p.data && p.data.avatar_url) || null);
      setActs(ac.data || []);
      setDeals((dl.data || []).filter((x) => !x.deleted));
      setFups(fu.data || []);
      setLeads(ld.data || []);
      setDevices(dv.data || []);
      setTargets(resolveTargets(tdf.data, tov.data));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [agentId]);

  const onPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) { setUpErr("Please use a JPG, PNG or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setUpErr("Image must be under 5MB."); return; }
    setUpBusy(true); setUpErr("");
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      const uid = au?.id; if (!uid) throw new Error("no session");
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = uid + "/avatar." + ext;
      const { error: e1 } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (e1) throw e1;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl + "?v=" + Date.now();
      const { error: er } = await supabase.rpc("set_my_avatar", { p_url: url });
      if (er) { const { error: e2 } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", uid); if (e2) throw e2; }
      setAvatarUrl(url); if (onAvatar) onAvatar(url);
    } catch (err) { setUpErr("Upload failed. Please try again."); }
    finally { setUpBusy(false); }
  };

  const setField = (k, v) => setAp((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true); setSaveMsg("");
    const keys = ["brn", "phone", "whatsapp", "job_title", "languages", "specialization", "bio", "nationality", "social_instagram", "social_linkedin", "social_tiktok", "social_youtube", "website", "signature_name", "signature_title", "signature_phone", "signature_whatsapp", "signature_email", "signature_brn", "signature_disclaimer"];
    const payload = { user_id: agentId };
    keys.forEach((k) => { payload[k] = ap[k] != null && ap[k] !== "" ? ap[k] : null; });
    const { error } = await supabase.from("agent_profiles").upsert(payload, { onConflict: "user_id" });
    setSaveMsg(error ? "Couldn't save — please try again." : "Saved.");
    setSaving(false);
    if (!error) setTimeout(() => setSaveMsg(""), 2500);
  };

  if (!canView) return <div style={{ ...card, padding: 22, maxWidth: 520, margin: "8px auto" }}><div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 800, color: T.ink }}>Access denied</div><div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>You can only view your own profile.</div><button onClick={() => go(self ? "myprofile" : "agent")} style={{ ...miniBtn(), marginTop: 14 }}>Back</button></div>;
  if (loading) return <div style={{ padding: 24, color: T.muted }}>Loading profile…</div>;
  if (!prof) return <div style={{ ...card, padding: 22 }}><div style={{ color: T.muted }}>Agent not found.</div></div>;

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonthD = new Date(now.getFullYear(), now.getMonth(), 1);
  const dow = (now.getDay() + 6) % 7;
  const startWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
  const startOf = period === "today" ? startToday : period === "week" ? startWeek : startMonthD;
  const inP = (iso) => iso && new Date(iso) >= startOf;
  const inTodayD = (iso) => iso && new Date(iso) >= startToday;
  const isReveal = (a) => a === "view_number" || a === "reveal_phone";
  const A = acts || [], F = fups || [], D = deals || [], L = leads || [];

  const cCalls = A.filter((x) => x.action === "call" && inP(x.created_at)).length;
  const cWa = A.filter((x) => x.action === "whatsapp" && inP(x.created_at)).length;
  const cReveal = A.filter((x) => isReveal(x.action) && inP(x.created_at)).length;
  const cViews = A.filter((x) => x.action === "view" && inP(x.created_at)).length;
  const cEmail = A.filter((x) => x.action === "email" && inP(x.created_at)).length;
  const fCompleted = F.filter((x) => x.status === "completed" && inP(x.completed_at)).length;
  const fOverdue = F.filter((x) => x.status === "scheduled" && x.due_at && new Date(x.due_at) < now).length;
  const fDueToday = F.filter((x) => x.status === "scheduled" && x.due_at && new Date(x.due_at) >= startToday && new Date(x.due_at) < new Date(startToday.getTime() + 864e5)).length;
  const subDate = (d) => d.submitted_at || d.created_at, apprDate = (d) => d.decided_at || d.created_at;
  const dealsSub = D.filter((d) => d.status !== "draft" && inP(subDate(d))).length;
  const apprDeals = D.filter((d) => d.status === "approved" && inP(apprDate(d)));
  const dealValue = apprDeals.reduce((s, d) => s + (Number(d.property_value) || 0), 0);
  const grossComm = apprDeals.reduce((s, d) => s + (Number(d.gross_commission) || 0), 0);
  const netAmber = apprDeals.reduce((s, d) => s + (Number(d.company_share != null ? d.company_share : (d.final_net != null ? d.final_net : d.net_commission)) || 0), 0);
  const tempCount = (re) => L.filter((x) => re.test(String(x.temperature || ""))).length;
  const newLeadsMonth = L.filter((x) => x.created_at && new Date(x.created_at) >= startMonthD).length;
  const notContacted = L.filter((x) => !x.last_contacted).length;

  const todayActs = A.filter((x) => inTodayD(x.created_at));
  const firstSeen = todayActs.length ? todayActs.map((x) => x.created_at).sort()[0] : null;
  const lastTimes = [prof.last_login].concat(A.map((x) => x.created_at)).concat((devices || []).map((d) => d.last_seen)).filter(Boolean);
  const lastActive = lastTimes.length ? lastTimes.reduce((m, t) => (new Date(t) > new Date(m) ? t : m)) : null;
  const activeSession = (devices || []).some((d) => !d.revoked && d.last_seen && (now - new Date(d.last_seen)) < 30 * 60 * 1000);
  const attStatus = activeSession ? "Active" : (firstSeen ? "Seen today" : "Offline");

  const periodLabel = period === "today" ? "today" : period === "week" ? "this week" : "this month";
  const sig = {
    name: ap.signature_name || prof.full_name || "Agent Name",
    title: ap.signature_title || ap.job_title || "Property Consultant",
    brn: ap.signature_brn || ap.brn || "",
    phone: ap.signature_phone || ap.phone || "",
    wa: ap.signature_whatsapp || ap.whatsapp || "",
    email: ap.signature_email || prof.email || "",
    disc: ap.signature_disclaimer || "",
  };

  const PStat = ({ label, value, tone }) => (
    <div style={{ ...card, padding: "12px 13px", minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: T.muted, fontWeight: 600, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 800, color: tone === "ok" ? T.ok : tone === "wa" ? WA : tone === "bad" ? T.bad : tone === "gold" ? T.gold : T.ink }}>{value}</div>
    </div>
  );
  const field = (label, k, ph) => <div key={k}><label style={lbl}>{label}</label>{editable ? <input value={ap[k] || ""} placeholder={ph || ""} onChange={(e) => setField(k, e.target.value)} style={inp} /> : <div style={{ ...inp, background: T.bone, display: "flex", alignItems: "center", minHeight: 41, color: ap[k] ? T.ink : T.faint }}>{ap[k] || "—"}</div>}</div>;
  const areaField = (label, k, ph) => <div key={k} style={{ gridColumn: "1 / -1" }}><label style={lbl}>{label}</label>{editable ? <textarea value={ap[k] || ""} placeholder={ph || ""} onChange={(e) => setField(k, e.target.value)} rows={3} style={{ ...inp, resize: "vertical", minHeight: 64 }} /> : <div style={{ ...inp, background: T.bone, minHeight: 50, color: ap[k] ? T.ink : T.faint, whiteSpace: "pre-wrap" }}>{ap[k] || "—"}</div>}</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {!self && <button onClick={() => go("performance")} style={{ ...miniBtn(), marginBottom: 12 }}>‹ Back to Agent Performance</button>}

      {/* Header */}
      <div style={{ ...card, padding: 18, marginBottom: 14, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <ApAvatar url={avatarUrl} name={prof.full_name} size={76} />
          {isOwn && <label title="Change photo" style={{ position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%", background: T.gold, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: upBusy ? "default" : "pointer", border: `2px solid ${T.paper}` }}><Camera size={13} /><input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhoto} disabled={upBusy} style={{ display: "none" }} /></label>}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800, color: T.ink }}>{prof.full_name || "—"}</div>
          <div style={{ fontSize: 12.5, color: T.gold, fontWeight: 700, marginTop: 2 }}>{ap.job_title || roleLabel(prof.role)}</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8, fontSize: 12, color: T.muted }}>
            {prof.email && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Mail size={12} /> {prof.email}</span>}
            {(ap.phone) && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Phone size={12} /> {ap.phone}</span>}
            {(ap.whatsapp) && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: WA }}><MessageCircle size={12} /> {ap.whatsapp}</span>}
            {ap.brn && <span>BRN {ap.brn}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11.5, color: T.muted, minWidth: 150 }}>
          <div><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: prof.active === false ? T.bad : (activeSession ? T.ok : T.faint), marginRight: 6 }} />{roleLabel(prof.role)}{prof.active === false ? " · inactive" : ""}</div>
          <div style={{ marginTop: 5 }}>Last login: {apFmtAgo(prof.last_login)}</div>
          <div style={{ marginTop: 3 }}>Last active: {apFmtAgo(lastActive)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[["overview", "Performance"], ["profile", "Profile & signature"]].map(([k, t]) => (
          <button key={k} onClick={() => setTab(k)} style={{ border: `1px solid ${tab === k ? T.gold : T.hair}`, background: tab === k ? T.goldSoft : T.paper, color: tab === k ? T.gold : T.ink, fontWeight: 700, fontSize: 12.5, padding: "8px 16px", borderRadius: 9, cursor: "pointer", fontFamily: UI }}>{t}</button>
        ))}
      </div>

      {tab === "overview" && <>
        {/* Attendance */}
        <SectionTitle>Attendance today</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
          <PStat label="Status" value={attStatus} tone={activeSession ? "ok" : undefined} />
          <PStat label="First seen today" value={firstSeen ? apFmtTime(firstSeen) : "—"} />
          <PStat label="Last active" value={apFmtAgo(lastActive)} />
          <PStat label="Active session" value={activeSession ? "Yes" : "No"} tone={activeSession ? "ok" : undefined} />
          <PStat label="Activity today" value={todayActs.length} />
        </div>

        {/* Period tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <SectionTitle>Performance · {periodLabel}</SectionTitle>
          <div style={{ display: "flex", gap: 5 }}>
            {[["today", "Today"], ["week", "This week"], ["month", "This month"]].map(([k, t]) => (
              <button key={k} onClick={() => setPeriod(k)} style={{ border: `1px solid ${period === k ? T.gold : T.hair}`, background: period === k ? T.goldSoft : T.paper, color: period === k ? T.gold : T.muted, fontWeight: 600, fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: UI }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
          <PStat label="Calls" value={cCalls} />
          <PStat label="WhatsApp" value={cWa} tone="wa" />
          <PStat label="Contact reveals" value={cReveal} />
          <PStat label="Lead views" value={cViews} />
          <PStat label="Follow-ups done" value={fCompleted} tone="ok" />
          <PStat label="Overdue follow-ups" value={fOverdue} tone={fOverdue ? "bad" : undefined} />
          <PStat label="Due today" value={fDueToday} />
          {cEmail > 0 && <PStat label="Emails" value={cEmail} />}
        </div>

        {/* Agent Targets (call / WhatsApp goals vs real logs) */}
        {targets && !targets.paused && (targets.call[period] != null || targets.whatsapp[period] != null) && <>
          <SectionTitle>Agent targets · {periodLabel}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            <TargetCard title={(period === "today" ? "Daily" : period === "week" ? "Weekly" : "Monthly") + " Calls"} done={tgtCount(A, "call", period)} target={targets.call[period]} unit="calls" onDetails={() => setTDetails({ action: "call", period, title: "Calls \u00b7 " + periodLabel, target: targets.call[period] })} />
            <TargetCard title={(period === "today" ? "Daily" : period === "week" ? "Weekly" : "Monthly") + " WhatsApp"} done={tgtCount(A, "whatsapp", period)} target={targets.whatsapp[period]} unit="msgs" onDetails={() => setTDetails({ action: "whatsapp", period, title: "WhatsApp \u00b7 " + periodLabel, target: targets.whatsapp[period] })} />
          </div>
        </>}
        {targets && targets.paused && <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 14 }}>Targets are paused for this agent.</div>}

        {/* Deals (approved only, from Deals module) */}
        <SectionTitle right={<span style={{ fontSize: 10.5, color: T.muted, fontWeight: 600 }}>approved deals only · from Deals module</span>}>Deal performance · {periodLabel}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
          <PStat label="Deals submitted" value={dealsSub} />
          <PStat label="Deals approved" value={apprDeals.length} tone="ok" />
          <PStat label="Deal value" value={apMoney(dealValue)} tone="gold" />
          <PStat label="Gross commission" value={apMoney(grossComm)} />
          <PStat label="Net to Amber Homes" value={apMoney(netAmber)} />
        </div>

        {/* Leads */}
        <SectionTitle>Lead book</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
          <PStat label="Assigned leads" value={L.length} />
          <PStat label="New this month" value={newLeadsMonth} />
          <PStat label="Hot" value={tempCount(/hot/i)} tone="bad" />
          <PStat label="Warm" value={tempCount(/warm/i)} />
          <PStat label="Cold" value={tempCount(/cold/i)} />
          <PStat label="Not contacted" value={notContacted} />
        </div>

        {/* Recent activity */}
        <SectionTitle>Recent activity</SectionTitle>
        <div style={{ ...card, padding: 6, marginBottom: 8 }}>
          {A.slice(0, 12).map((x, i) => {
            const ic = x.action === "call" ? <Phone size={13} /> : x.action === "whatsapp" ? <MessageCircle size={13} /> : isReveal(x.action) ? <Eye size={13} /> : <CircleDot size={13} />;
            const lab = x.action === "call" ? "Called" : x.action === "whatsapp" ? "WhatsApp" : x.action === "view_number" || x.action === "reveal_phone" ? "Revealed contact" : x.action === "view" ? "Viewed lead" : x.action;
            return <div key={i} onClick={() => x.lead_id && openLead && openLead(x.lead_id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderBottom: i < Math.min(A.length, 12) - 1 ? `1px solid ${T.hairSoft}` : "none", cursor: x.lead_id ? "pointer" : "default" }}>
              <span style={{ color: x.action === "whatsapp" ? WA : T.muted }}>{ic}</span>
              <span style={{ fontSize: 12.5, color: T.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lab}{x.detail && x.detail.client ? " · " + x.detail.client : ""}</span>
              <span style={{ fontSize: 11, color: T.faint }}>{apFmtAgo(x.created_at)}</span>
            </div>;
          })}
          {A.length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: T.muted, textAlign: "center" }}>No recorded activity yet this month.</div>}
        </div>
        <div style={{ fontSize: 10.5, color: T.faint, marginBottom: 8 }}>Counts come from real CRM logs (call / WhatsApp / reveal clicks, follow-ups, and approved deals). Hot-resale listings are not counted as closed deals.</div>
      </>}

      {tab === "profile" && <>
        {saveMsg && <div style={{ ...card, padding: "9px 13px", marginBottom: 12, fontSize: 12.5, fontWeight: 600, color: saveMsg.startsWith("Saved") ? T.ok : T.bad, background: saveMsg.startsWith("Saved") ? T.okSoft : T.badSoft, borderColor: (saveMsg.startsWith("Saved") ? T.ok : T.bad) + "44" }}>{saveMsg}</div>}
        {!editable && <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 10 }}>Read-only — only the agent (or a Master Admin) can edit these fields.</div>}

        <SectionTitle>Professional details</SectionTitle>
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {field("Job title / designation", "job_title", "e.g. Senior Property Consultant")}
            {field("BRN number", "brn", "e.g. 45678")}
            {field("Phone", "phone", "+971 5X XXX XXXX")}
            {field("WhatsApp", "whatsapp", "+971 5X XXX XXXX")}
            {field("Languages", "languages", "e.g. English, Arabic, Russian")}
            {field("Specialization", "specialization", "e.g. Off-plan, Palm Jebel Ali, Emaar")}
            {field("Nationality (optional)", "nationality", "")}
            {areaField("Short bio (optional)", "bio", "A few lines about your experience…")}
          </div>
        </div>

        <SectionTitle>Social links (optional)</SectionTitle>
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {field("Instagram", "social_instagram", "@handle or URL")}
            {field("LinkedIn", "social_linkedin", "profile URL")}
            {field("TikTok", "social_tiktok", "@handle or URL")}
            {field("YouTube", "social_youtube", "channel URL")}
            {field("Website", "website", "https://")}
          </div>
        </div>

        <SectionTitle right={<span style={{ fontSize: 10.5, color: T.muted, fontWeight: 600 }}>used in WhatsApp / email / PDF footers</span>}>Signature</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14, marginBottom: 8 }} className="ap-sig-grid">
          <div style={{ ...card, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {field("Display name", "signature_name", prof.full_name || "")}
              {field("Title", "signature_title", "Property Consultant")}
              {field("Signature phone", "signature_phone", ap.phone || "")}
              {field("Signature WhatsApp", "signature_whatsapp", ap.whatsapp || "")}
              {field("Signature email", "signature_email", prof.email || "")}
              {field("Signature BRN", "signature_brn", ap.brn || "")}
              {areaField("Disclaimer (optional)", "signature_disclaimer", "e.g. This message is intended only for the named recipient…")}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 7 }}>Signature preview</div>
            <div style={{ background: T.paper, border: `1px solid ${T.hairSoft}`, borderRadius: 12, padding: 18, boxShadow: T.shadow }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <ApAvatar url={avatarUrl} name={sig.name} size={52} />
                <div style={{ borderLeft: `3px solid ${T.gold}`, paddingLeft: 12 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 800, color: T.ink }}>{sig.name}</div>
                  <div style={{ fontSize: 11.5, color: T.gold, fontWeight: 700 }}>{sig.title}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>Amber Homes Real Estate</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 11.5, color: T.muted, lineHeight: 1.7 }}>
                {sig.brn && <div>BRN: {sig.brn}</div>}
                {sig.phone && <div>M: {sig.phone}</div>}
                {sig.wa && <div>W: {sig.wa}</div>}
                {sig.email && <div>E: {sig.email}</div>}
              </div>
              {sig.disc && <div style={{ marginTop: 10, fontSize: 9.5, color: T.faint, fontStyle: "italic", lineHeight: 1.5 }}>{sig.disc}</div>}
            </div>
          </div>
        </div>

        {editable && <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
          <button onClick={save} disabled={saving} style={{ border: "none", background: T.gold, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10, cursor: saving ? "default" : "pointer", fontFamily: UI, display: "flex", alignItems: "center", gap: 7, opacity: saving ? 0.7 : 1 }}><Save size={15} /> {saving ? "Saving…" : "Save profile"}</button>
          {upErr && <span style={{ fontSize: 12, color: T.bad }}>{upErr}</span>}
        </div>}
      </>}
      {tDetails && <TargetDetailsModal agentId={agentId} agentName={prof.full_name} action={tDetails.action} period={tDetails.period} title={tDetails.title} target={tDetails.target} openLead={openLead} onClose={() => setTDetails(null)} />}
    </div>
  );
}

function AgentsRoster({ user, go, openAgent }) {
  const canView = user && (user.role === "master_admin" || user.role === "admin");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("all");

  useEffect(() => {
    let alive = true;
    if (!canView) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const d = new Date();
      const startToday = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const [pp, aa, dv] = await Promise.all([
        supabase.from("profiles").select("id,full_name,role,active,last_login,avatar_url").limit(2000),
        supabase.from("lead_activity").select("actor_id,action,created_at").gte("created_at", startToday).limit(8000),
        supabase.from("user_devices").select("user_id,last_seen,revoked").limit(2000),
      ]);
      if (!alive) return;
      const acts = aa.data || [], devs = dv.data || [];
      const byActor = {};
      acts.forEach((x) => { (byActor[x.actor_id] = byActor[x.actor_id] || []).push(x); });
      const devByUser = {};
      devs.forEach((x) => { (devByUser[x.user_id] = devByUser[x.user_id] || []).push(x); });
      const now = Date.now();
      const out = (pp.data || []).filter((p) => AP_STAFF_ROLES.includes(p.role)).map((p) => {
        const ta = byActor[p.id] || [];
        const isRev = (a) => a === "view_number" || a === "reveal_phone";
        const firstSeen = ta.length ? ta.map((x) => x.created_at).sort()[0] : null;
        const myDevs = devByUser[p.id] || [];
        const active = myDevs.some((dd) => !dd.revoked && dd.last_seen && (now - new Date(dd.last_seen)) < 30 * 60 * 1000);
        const lastTimes = [p.last_login].concat(ta.map((x) => x.created_at)).concat(myDevs.map((dd) => dd.last_seen)).filter(Boolean);
        const lastActive = lastTimes.length ? lastTimes.reduce((m, t) => (new Date(t) > new Date(m) ? t : m)) : null;
        return { ...p, firstSeen, lastActive, active, calls: ta.filter((x) => x.action === "call").length, wa: ta.filter((x) => x.action === "whatsapp").length, reveals: ta.filter((x) => isRev(x.action)).length };
      }).sort((a, b) => (b.active - a.active) || (new Date(b.lastActive || 0) - new Date(a.lastActive || 0)));
      setRows(out); setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (!canView) return <div style={{ ...card, padding: 22, maxWidth: 520, margin: "8px auto" }}><div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 800, color: T.ink }}>Access denied</div><div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>The team & attendance view is available to Master Admin and Admin.</div></div>;

  const filtered = rows.filter((r) => (roleF === "all" || r.role === roleF) && (!q || String(r.full_name || "").toLowerCase().includes(q.toLowerCase())));
  const presentToday = rows.filter((r) => r.firstSeen).length;
  const activeNow = rows.filter((r) => r.active).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <SectionTitle right={<span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{activeNow} active now · {presentToday}/{rows.length} seen today</span>}>Team & Attendance</SectionTitle>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.faint }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agent…" style={{ width: "100%", padding: "9px 12px 9px 33px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontSize: 13, fontFamily: UI, boxSizing: "border-box" }} />
        </div>
        <select value={roleF} onChange={(e) => setRoleF(e.target.value)} style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontSize: 13, fontFamily: UI, cursor: "pointer" }}>
          <option value="all">All roles</option><option value="agent">Agent</option><option value="sales_manager">Sales Manager</option><option value="admin">Admin</option><option value="master_admin">Master Admin</option>
        </select>
      </div>

      {loading ? <div style={{ padding: 24, color: T.muted }}>Loading team…</div> : (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {filtered.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.hairSoft}` : "none", flexWrap: "wrap" }}>
              <ApAvatar url={r.avatar_url} name={r.full_name} size={42} />
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: T.ink }}>{r.full_name || "—"}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{roleLabel(r.role)}{r.active === false ? " · inactive" : ""}</div>
              </div>
              <div style={{ minWidth: 110, fontSize: 11, color: T.muted }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: r.active ? T.ok : (r.firstSeen ? T.gold : T.faint), display: "inline-block" }} />{r.active ? "Active now" : (r.firstSeen ? "Seen today" : "Offline")}</div>
                <div style={{ marginTop: 3 }}>{apFmtAgo(r.lastActive)}</div>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: T.muted, minWidth: 160 }}>
                <span title="Calls today" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Phone size={12} /> {r.calls}</span>
                <span title="WhatsApp today" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: WA }}><MessageCircle size={12} /> {r.wa}</span>
                <span title="Reveals today" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Eye size={12} /> {r.reveals}</span>
              </div>
              <button onClick={() => openAgent(r.id)} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold, display: "flex", alignItems: "center", gap: 5 }}>View profile <ChevronRight size={13} /></button>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 20, color: T.muted, fontSize: 13, textAlign: "center" }}>No agents match.</div>}
        </div>
      )}
      <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8 }}>Attendance is derived from CRM activity, last login and active sessions (Dubai time). Today's calls / WhatsApp / reveals come from real action logs.</div>
    </div>
  );
}


function AgentDash({ go, user, openLead, onAvatar }) {
  const [rows, setRows] = useState(null);
  const [acts, setActs] = useState([]);
  const [deals, setDeals] = useState([]);
  const [fups, setFups] = useState([]);
  const [period, setPeriod] = useState("month");
  const [cf, setCf] = useState(""); const [ct, setCt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [upBusy, setUpBusy] = useState(false);
  const [upErr, setUpErr] = useState("");
  const fileRef = useRef(null);
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
      const [lr, ar, dr] = await Promise.all([
        (async () => { try {
          if (!uid) return { data: [] };
          let out = [], from = 0;
          for (;;) {
            const { data, error } = await supabase.from("leads")
              .select("id, client_name, phone, project, area, budget, status, temperature, next_followup, last_contacted, is_open, assigned_agent, current_owner, created_by, deal_value, commission_value, created_at, created_on")
              .or(`assigned_agent.eq.${uid},current_owner.eq.${uid},created_by.eq.${uid}`)
              .order("created_at", { ascending: false }).range(from, from + 999);
            if (error) return { error };
            out = out.concat(data || []);
            if (!data || data.length < 1000) break;
            from += 1000; if (from >= 50000) break;
          }
          return { data: out };
        } catch (error) { return { error }; } })(),
        supabase.from("lead_activity").select("action, created_at").eq("actor_id", uid).order("created_at", { ascending: false }).limit(5000),
        supabase.from("deals").select("status, deal_type, property_value, gross_commission, net_commission, agent_commission, decided_at, created_at").eq("agent_id", uid).limit(1000),
      ]);
      if (lr.error) { setErr("Unable to load your dashboard. Please try again or contact admin."); setRows([]); return; }
      const mine = (lr.data || []).filter((l) => l.assigned_agent === uid || l.current_owner === uid || l.created_by === uid);
      setRows(mine); setActs(ar.data || []); setDeals(dr.data || []);
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
      const res = await callAi({ mentor: mentor.id, crmContext: ctx, role: user && user.role, messages: [{ role: "user", content: prompt }] });
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

  // ---- profile photo upload (Supabase Storage 'avatars' bucket; profiles.avatar_url) ----
  const onPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) { setUpErr("Please use a JPG, PNG or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setUpErr("Image must be under 5MB."); return; }
    setUpBusy(true); setUpErr("");
    try {
      const { data: { user: au } } = await supabase.auth.getUser();
      const uid = au?.id; if (!uid) throw new Error("no session");
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = uid + "/avatar." + ext;
      const { error: e1 } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (e1) throw e1;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl + "?v=" + Date.now(); // cache-bust so the new image shows immediately
      // Persist via SECURITY DEFINER fn — agents have no profiles self-update policy (prevents role escalation);
      // fall back to a direct update (admins) if the function isn't deployed yet.
      const { error: er } = await supabase.rpc("set_my_avatar", { p_url: url });
      if (er) { const { error: e2 } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", uid); if (e2) throw e2; }
      setAvatarUrl(url);
      if (onAvatar) onAvatar(url);
    } catch (err) { setUpErr("Upload failed. Please try again."); }
    finally { setUpBusy(false); }
  };

  // ---- period-scoped REAL performance metrics (Asia/Dubai) ----
  const dStr = (iso) => { try { return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); } catch (e) { return ""; } };
  const dNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }));
  const ymd = (dt) => dt.toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  const PERIODS = [["today", "Today"], ["week", "Week"], ["lastweek", "Last week"], ["month", "Month"], ["quarter", "Quarter"], ["half", "6 Months"], ["year", "Year"]];
  const monBack = (dt, n) => { const x = new Date(dt); const off = (x.getDay() + 6) % 7; x.setDate(x.getDate() - off - n); return x; };
  const periodStart = (() => {
    const d = new Date(dNow);
    if (period === "custom") return cf || ymd(d);
    if (period === "today") return ymd(d);
    if (period === "week") { d.setDate(d.getDate() - 6); return ymd(d); }
    if (period === "lastweek") return ymd(monBack(dNow, 7));
    if (period === "month") return ymd(new Date(dNow.getFullYear(), dNow.getMonth(), 1));
    if (period === "quarter") return ymd(new Date(dNow.getFullYear(), Math.floor(dNow.getMonth() / 3) * 3, 1));
    if (period === "half") { d.setDate(d.getDate() - 181); return ymd(d); }
    if (period === "year") return ymd(new Date(dNow.getFullYear(), 0, 1));
    return ymd(d);
  })();
  const periodEnd = period === "custom" ? (ct || today) : period === "lastweek" ? ymd(monBack(dNow, 1)) : today;
  const inPeriod = (iso) => { const s = dStr(iso); return s && s >= periodStart && s <= periodEnd; };
  const periodLabel = period === "custom" ? ((cf && ct) ? (cf + " → " + ct) : "custom range") : (PERIODS.find((p) => p[0] === period) || ["", ""])[1];

  const actsIn = acts.filter((a) => inPeriod(a.created_at));
  const callsN = actsIn.filter((a) => a.action === "call").length;
  const waN = actsIn.filter((a) => a.action === "whatsapp").length;
  const viewsN = actsIn.filter((a) => a.action === "view_number" || a.action === "view").length;
  const fupDoneN = actsIn.filter((a) => a.action === "followup_completed").length;
  const contactN = callsN + waN + viewsN;
  const leadsAssignedN = mine.filter((l) => inPeriod(l.created_at || l.created_on)).length;
  const apprDeals = deals.filter((d) => d.status === "approved" && inPeriod(d.decided_at || d.created_at));
  const closedN = apprDeals.length;
  const valueClosed = apprDeals.reduce((s, d) => s + (Number(d.property_value) || 0), 0);
  const grossComm = apprDeals.reduce((s, d) => s + (Number(d.gross_commission) || 0), 0);
  const agentComm = apprDeals.reduce((s, d) => s + (Number(d.agent_commission) || 0), 0);
  const netComm = apprDeals.reduce((s, d) => s + (Number(d.net_commission) || 0), 0);
  const pendingDeals = deals.filter((d) => d.status === "submitted" || d.status === "pending_review").length;
  const warm = mine.filter((l) => l.temperature === "Warm");
  const cold = mine.filter((l) => l.temperature !== "Hot" && l.temperature !== "Very Hot" && l.temperature !== "Warm" && l.status !== "Closed Won" && l.status !== "Closed Lost");
  const aed0 = (n) => "AED " + Math.round(n).toLocaleString("en-US");

  return <div>
    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhoto} style={{ display: "none" }} />
    {/* greeting banner */}
    <div style={{ ...card, padding: "22px 24px", background: T.hero, border: "none", boxShadow: T.shadowLg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Av name={user?.name || "Agent"} src={avatarUrl || undefined} size={(typeof window !== "undefined" && window.innerWidth < 768) ? 60 : 76} round dark />
          <button onClick={() => !upBusy && fileRef.current && fileRef.current.click()} title="Upload / change photo"
            style={{ position: "absolute", right: -2, bottom: -2, width: 26, height: 26, borderRadius: "50%", border: "2px solid " + T.hero,
              background: T.btnBg, color: T.btnFg, display: "grid", placeItems: "center", cursor: upBusy ? "default" : "pointer", padding: 0 }}>
            {upBusy ? <span style={{ fontSize: 9, fontWeight: 700 }}>…</span> : <Camera size={13} />}</button>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, color: "#fff", lineHeight: 1.1 }}>{greetWord(h)}, {firstName(user?.name)}</div>
          <div style={{ fontSize: 12, color: T.goldBright, fontWeight: 700, marginTop: 3 }}>{user?.roleLabel || "Agent"}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.62)", marginTop: 4 }}>{new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", weekday: "long", day: "numeric", month: "long" })} · Dubai</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.82)", marginTop: 7 }}>{motiv}</div>
          {upErr && <div style={{ fontSize: 11.5, color: "#ffd9d5", marginTop: 6 }}>{upErr}</div>}
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
      {/* ===== My Performance (real data, period-scoped) ===== */}
      <div style={{ ...card, padding: 0, marginTop: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "15px 18px 0", flexWrap: "wrap" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 9 }}><BarChart3 size={19} color={T.gold} /> My Performance</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {PERIODS.map(([k, lbl]) => (
              <button key={k} onClick={() => setPeriod(k)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: UI,
                border: "1px solid " + (period === k ? T.btnBg : T.hair), background: period === k ? T.btnBg : T.paper, color: period === k ? T.btnFg : T.muted }}>{lbl}</button>
            ))}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 7px 3px 9px", borderRadius: 999, border: "1px solid " + (period === "custom" ? T.btnBg : T.hair), background: period === "custom" ? T.goldSoft : T.paper }}>
              <Calendar size={13} color={period === "custom" ? T.gold : T.muted} />
              <input type="date" value={cf} max={ct || undefined} onChange={(e) => setCf(e.target.value)} title="From" style={{ border: "none", background: "transparent", color: T.ink, fontSize: 11.5, fontFamily: UI, cursor: "pointer" }} />
              <span style={{ color: T.faint, fontSize: 11 }}>→</span>
              <input type="date" value={ct} min={cf || undefined} onChange={(e) => setCt(e.target.value)} title="To" style={{ border: "none", background: "transparent", color: T.ink, fontSize: 11.5, fontFamily: UI, cursor: "pointer" }} />
              <button onClick={() => { if (cf && ct && cf <= ct) setPeriod("custom"); }} disabled={!(cf && ct && cf <= ct)} style={{ padding: "5px 10px", borderRadius: 999, border: "none", background: (cf && ct && cf <= ct) ? T.btnBg : T.hair, color: (cf && ct && cf <= ct) ? T.btnFg : T.muted, fontSize: 11.5, fontWeight: 700, fontFamily: UI, cursor: (cf && ct && cf <= ct) ? "pointer" : "default" }}>Apply</button>
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, padding: 18 }}>
          {[
            { ic: Database, label: "Leads Assigned", val: leadsAssignedN, sub: periodLabel, tone: "ink" },
            { ic: PhoneCall, label: "Calls Made", val: callsN, sub: periodLabel, tone: "ink" },
            { ic: MessageCircle, label: "WhatsApp Actions", val: waN, sub: periodLabel, tone: "wa" },
            { ic: CheckCircle2, label: "Follow-Ups Done", val: fupDoneN, sub: periodLabel, tone: "ok" },
            { ic: Coins, label: "Closed Deals", val: closedN, sub: periodLabel, tone: "gold" },
            { ic: Wallet, label: "Commission Earned", val: aed0(agentComm), sub: "approved · " + periodLabel, tone: "gold", small: true },
          ].map((c, i) => (
            <div key={i} style={{ border: "1px solid " + T.hair, borderRadius: 13, padding: "13px 15px", background: T.paper }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: T.muted }}>
                <c.ic size={15} color={c.tone === "gold" ? T.gold : c.tone === "wa" ? WA : c.tone === "ok" ? T.ok : T.inkSoft} />
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{c.label}</span>
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: c.small ? 19 : 27, marginTop: 6, color: c.tone === "gold" ? T.gold : c.tone === "bad" ? T.bad : T.ink, lineHeight: 1.1 }}>{c.val}</div>
              <div style={{ fontSize: 10.5, color: T.faint, marginTop: 3 }}>{c.sub}</div>
            </div>
          ))}
        </div>
        {/* closing + activity + quality rows */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, padding: "0 18px 18px" }}>
          <div style={{ border: "1px solid " + T.hair, borderRadius: 13, padding: "13px 15px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted, marginBottom: 9 }}>Closing — {periodLabel}</div>
            {[["Property value closed", aed0(valueClosed)], ["Gross commission", aed0(grossComm)], ["My commission (approved)", aed0(agentComm)], ["Deals pending approval", String(pendingDeals)]].map(([l, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", borderBottom: i < 3 ? "1px solid " + T.hairSoft : "none" }}><span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 700, color: T.ink }}>{v}</span></div>
            ))}
          </div>
          <div style={{ border: "1px solid " + T.hair, borderRadius: 13, padding: "13px 15px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted, marginBottom: 9 }}>Activity — {periodLabel}</div>
            {[["Calls made", callsN], ["WhatsApp actions", waN], ["Numbers viewed", viewsN], ["Total contact actions", contactN]].map(([l, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", borderBottom: i < 3 ? "1px solid " + T.hairSoft : "none" }}><span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 700, color: T.ink }}>{v}</span></div>
            ))}
          </div>
          <div style={{ border: "1px solid " + T.hair, borderRadius: 13, padding: "13px 15px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted, marginBottom: 9 }}>Lead quality — now</div>
            {[["Hot / very hot", hot.length, T.bad], ["Warm", warm.length, T.warn], ["Cold", cold.length, T.muted], ["Overdue follow-ups", overdue.length, overdue.length ? T.bad : T.ok]].map(([l, v, c], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", borderBottom: i < 3 ? "1px solid " + T.hairSoft : "none" }}><span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 700, color: c }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: T.faint, padding: "0 18px 14px" }}>All figures are your own real CRM activity. "Leads Assigned" counts leads created in the period; commission reflects approved deals only.</div>
      </div>

      <MyTargets userId={user && user.id} selfId={user && user.id} acts={acts} openLead={openLead} />

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
                    {f.lead?.phone && <button title="WhatsApp" onClick={() => window.open(waHref(f.lead.phone), "_blank")} style={{ ...miniBtn(), padding: "6px 10px", fontSize: 11, borderColor: WA, color: WA }}><MessageCircle size={12} /></button>}
                    {f.lead?.phone && <button title="Call" onClick={() => { logActivityReliable("call", { id: f.lead_id, client_name: f.lead && f.lead.client_name }, user && user.id); stampContactedReliable(f.lead_id, user && user.id); window.location.href = telHref(f.lead.phone); }} style={{ ...miniBtn(), padding: "6px 10px", fontSize: 11 }}><Phone size={12} /></button>}
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
                  {(() => { const sc = leadScore(l).score; return <span title="Lead score (0-100)" style={{ fontSize: 10, fontWeight: 800, background: sc >= 75 ? T.okSoft : sc >= 55 ? T.goldSoft : T.bone, color: sc >= 75 ? T.ok : sc >= 55 ? T.gold : T.muted, border: sc < 55 ? `1px solid ${T.hair}` : "none", borderRadius: 6, padding: "1px 6px" }}>★ {sc}</span>; })()}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{[l.area, l.project, l.budget].filter(Boolean).join(" · ") || "—"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {l.phone && <a href={waHref(l.phone)} target="_blank" rel="noreferrer"
                  onClick={(e) => { e.stopPropagation(); logAction("whatsapp", l, user && user.id); }}
                  style={{ width: 34, height: 34, borderRadius: 9, background: T.okSoft, display: "grid", placeItems: "center", textDecoration: "none" }}>
                  <MessageCircle size={15} color={WA} /></a>}
                {l.phone && <a href={telHref(l.phone)}
                  onClick={(e) => { e.stopPropagation(); logActivityReliable("call", l, user && user.id); stampContactedReliable(l.id, user && user.id); }}
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
        {l.phone && <a href={waHref(l.phone)} target="_blank" rel="noreferrer"
          style={{ fontSize: 11.5, color: WA, fontWeight: 700, textDecoration: "none" }}>WhatsApp</a>}
      </div>
    ))}
  </div>;
}

/* ============================= 3 LEAD DETAIL ============================= */
function LeadDetail({ leadId, user, go, openLead, from, siblings }) {
  // Prev/Next step through the list the lead was opened from (the current page of that list).
  const sibs = Array.isArray(siblings) ? siblings : [];
  const sibIdx = sibs.indexOf(leadId);
  const prevLeadId = sibIdx > 0 ? sibs[sibIdx - 1] : null;
  const nextLeadId = (sibIdx >= 0 && sibIdx < sibs.length - 1) ? sibs[sibIdx + 1] : null;
  // Context-aware Back target/label based on where the lead was opened from.
  const backTo = from === "open" ? { screen: "open", label: "Back to Open Leads" }
    : from === "assign" ? { screen: "assign", label: "Back to Lead Assignment" }
    : from === "live" ? { screen: "live", label: user && user.role === "agent" ? "Back to My Leads" : "Back to Leads" }
    : from === "agent" ? { screen: "agent", label: "Back to Dashboard" }
    : (from && from !== "lead") ? { screen: from, label: "Back" }
    : { screen: user && user.role === "agent" ? "agent" : "live", label: user && user.role === "agent" ? "Back to My Leads" : "Back to Leads" };
  const [lead, setLead] = useState(null);
  const [showDeal, setShowDeal] = useState(false);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [agents, setAgents] = useState([]);
  const [err, setErr] = useState("");
  const [err2, setErr2] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [prevReveal, setPrevReveal] = useState(false);     // true when THIS agent revealed THIS lead in a past session
  const [revealMsg, setRevealMsg] = useState("");          // quota / pause / low-balance notice
  const [openModal, setOpenModal] = useState(false);        // "Mark as Open" reason dialog
  const [openReason, setOpenReason] = useState("");
  const [openBusy, setOpenBusy] = useState(false);
  const [lockModal, setLockModal] = useState(false);   // manual lock reason dialog
  const [lockReason, setLockReason] = useState("");
  const [lockBusy, setLockBusy] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sched, setSched] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [dupEdit, setDupEdit] = useState(null);   // duplicate found when an admin changes the phone
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
  const isMaster = user && user.role === "master_admin";
  const leadClosed = !!(lead && (lead.closed_locked || lead.status === "Closed Won" || lead.status === "Closed Won Pending Approval"));
  const canReassign = isMaster || (isAdmin && !leadClosed);
  const [draftRow, setDraftRow] = useState(null);
  useEffect(() => { let alive = true; (async () => {
    if (!lead || !lead.id || !me || !me.id) { setDraftRow(null); return; }
    let res = await supabase.from("deals").select("*").eq("lead_id", lead.id).eq("agent_id", me.id).eq("status", "draft").eq("deleted", false).eq("archived", false).order("updated_at", { ascending: false }).limit(1);
    if (res.error) res = await supabase.from("deals").select("*").eq("lead_id", lead.id).eq("agent_id", me.id).eq("status", "draft").eq("deleted", false).order("updated_at", { ascending: false }).limit(1);
    if (alive) setDraftRow(res && res.data && res.data[0] ? res.data[0] : null);
  })(); return () => { alive = false; }; }, [lead && lead.id, me && me.id]);

  // Field groups (data-driven so view + edit stay in sync).
  const GROUPS = {
    contact: [["client_name", "Client name", "text"], ["phone", "Phone", "text"], ["whatsapp", "WhatsApp", "text"], ["email", "Email", "text"]],
    profile: [["nationality", "Nationality", "text"], ["country_residence", "Country of residence", "text"], ["language", "Language", "text"]],
    invest: [["lead_type", "Lead type", "select", ["Buyer", "Seller", "Tenant", "Agent"]],
      ["budget", "Budget", "text"], ["purpose", "Purpose", "select", ["Investment", "Personal use", "Both", "Not sure"]],
      ["area", "Area / Community", "text"], ["project", "Project name", "text"], ["developer", "Developer", "text"],
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
  const AGENT_KEYS = ["lead_type", "nationality", "country_residence", "language", "budget", "purpose", "area", "project", "developer", "property_type", "ready_offplan", "finance", "timeline", "status", "temperature", "last_contacted", "next_followup"];
  const LOCKED_FOR_AGENT = ["client_name", "phone", "whatsapp", "email", "source"];
  const LABELS = {}; [].concat(...Object.values(GROUPS)).forEach((d) => { LABELS[d[0]] = d[1]; });
  const isAssignedAgent = user && user.role === "agent" && lead && (lead.assigned_agent === user.id || lead.created_by === user.id);
  // For an open-pool lead the agent does NOT own, contact must be revealed (logged + quota) before use.
  const mustRevealOpen = lead && lead.is_open === true && !isAdmin && !(user && (lead.assigned_agent === user.id || lead.created_by === user.id || lead.current_owner === user.id));
  const canEditAll = isAdmin;
  const canEdit = canEditAll || isAssignedAgent;
  const editableKeys = canEditAll ? ALL_KEYS : AGENT_KEYS;

  const loadAll = async () => {
    if (!leadId) { setErr("none"); return; }
    setErr("");
    const { data: l, error } = await supabase.from("leads").select("*").eq("id", leadId).single();
    if (error || !l) { setErr("load"); return; }
    setLead(l);
    logAction("view", l, me && me.id);                   // per-lead view log for EVERY opener (incl. Prev/Next)
    setRevealMsg("");
    if (isAdmin) { setRevealed(true); }
    else {
      // Reveal state is strictly per (lead, user): every lead starts MASKED, so Next never inherits a reveal.
      setRevealed(false); setPrevReveal(false);
      // Open-pool leads the agent does NOT own: ALWAYS require a fresh reveal, so every single access is
      // logged + quota-counted (no "previously revealed" shortcut). Only the agent's OWN leads restore a
      // prior reveal — so they aren't re-charged for re-opening a lead they already hold.
      const owns = me && (l.assigned_agent === me.id || l.created_by === me.id || l.current_owner === me.id);
      const openPoolNotOwned = l.is_open === true && !owns;
      if (!openPoolNotOwned) {
        try {
          const { data: pr } = await supabase.from("lead_reveals").select("id").eq("lead_id", leadId).eq("agent_id", me.id).limit(1);
          if (pr && pr.length) { setRevealed(true); setPrevReveal(true); }
        } catch (e) {}
      }
    }
    try {
      const { data: ag } = await supabase.rpc("user_directory");
      setAgents((ag || []).slice().sort((a, b) => String(a.full_name || "").localeCompare(String(b.full_name || ""))));
    } catch (e) {}
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
  const reveal = async () => {
    setRevealMsg("");
    const { data, error } = await supabase.rpc("reveal_contact", { p_lead_id: lead.id });
    if (error) { setRevealed(true); logAction("view_number", lead, me && me.id); return; }  // pre-migration fallback (reveal only — not a contact)
    if (data && data.error) { setRevealMsg(data.error === "forbidden" ? "You don't have access to this lead's contact details." : "Couldn't reveal this contact. Please try again."); return; }
    if (data && data.blocked) {
      setRevealMsg(data.reason === "quota"
        ? "You have reached your weekly contact reveal limit. Please speak to your manager."
        : "Contact reveals are paused on your account. Please speak to your manager.");
      return;
    }
    if (data && (data.phone || data.whatsapp || data.email)) setLead((l) => ({ ...l, phone: data.phone || l.phone, whatsapp: data.whatsapp || l.whatsapp, email: data.email || l.email }));
    setRevealed(true);   // revealing logs the reveal (RPC) but is NOT "contact" — Last Contact updates only on call/WhatsApp/email/follow-up
    if (data && data.warn && data.remaining != null) setRevealMsg("Heads up — " + data.remaining + " contact reveals left this week.");
  };
  const doMarkOpen = async () => {
    setOpenBusy(true);
    const { data, error } = await supabase.rpc("mark_lead_open", { p_lead_id: lead.id, p_reason: openReason || null });
    setOpenBusy(false);
    if (error || (data && data.error)) { setOpenModal(false); setErr2(data && data.error === "locked_status" ? "This lead's status doesn't allow releasing it to Open Leads." : (data && data.error === "disabled" ? "Marking leads open is currently disabled by your admin." : "Couldn't mark this lead as open. Please try again.")); return; }
    setOpenModal(false); go("live");
  };
  const doLock = async () => {
    if (!lockReason) return;
    setLockBusy(true);
    const { data, error } = await supabase.rpc("lock_lead", { p_lead_id: lead.id, p_reason: lockReason });
    setLockBusy(false);
    if (error || (data && data.error)) {
      setLockModal(false);
      setErr2(data && data.error === "forbidden" ? "You can only lock a lead that's assigned to you."
        : (data && data.error === "is_open" ? "This lead is in the Open pool, so it can't be locked."
        : (data && data.error === "bad_reason" ? "Please choose a valid reason." : "Couldn't lock this lead. Please try again.")));
      return;
    }
    setLockModal(false); loadAll();
  };
  const doUnlock = async () => {
    setLockBusy(true);
    const { data, error } = await supabase.rpc("unlock_lead", { p_lead_id: lead.id });
    setLockBusy(false);
    if (error || (data && data.error)) { setErr2("Couldn't unlock this lead. Please try again."); return; }
    loadAll();
  };
  const doAssignSelf = async () => {
    setOpenBusy(true);
    const { data, error } = await supabase.rpc("assign_open_lead", { p_lead_id: lead.id });
    setOpenBusy(false);
    if (error || (data && data.error)) { setErr2(data && data.error === "not_open" ? "This lead is no longer in the open pool." : (data && data.error === "paused" ? "Assignments are paused on your account. Please speak to your manager." : (data && data.error === "disabled" ? "Self-assigning open leads is currently disabled by your admin." : "Couldn't assign this lead. Please try again."))); return; }
    loadAll();
  };
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
  const saveEdit = async (overrideDup) => {
    setSaving(true); setErr2("");
    const changes = {};
    editableKeys.forEach((k) => { const nv = form[k] == null ? null : form[k]; const ov = lead[k] == null ? null : lead[k];
      if (String(nv || "") !== String(ov || "")) changes[k] = nv === "" ? null : nv; });
    if (Object.keys(changes).length === 0) { setEditing(false); setSaving(false); return; }
    // Normalize any contact-number change to E.164, and (admins only reach here) block a phone change
    // that collides with another lead's number unless explicitly overridden.
    if (changes.phone != null) changes.phone = toE164(changes.phone);
    if (changes.whatsapp != null) changes.whatsapp = toE164(changes.whatsapp);
    if (changes.phone != null && !overrideDup) {
      const res = await supabase.rpc("check_duplicate_phone", { p_phone: changes.phone });
      if (!res.error) {
        if (res.data && res.data.exists && res.data.lead_id && res.data.lead_id !== lead.id) { setDupEdit(res.data); setSaving(false); return; }
      } else {
        const { data: hit } = await supabase.from("leads").select("id, lead_code, client_name").eq("phone", changes.phone).neq("id", lead.id).limit(1);
        if (hit && hit.length) { setDupEdit({ exists: true, lead_id: hit[0].id, lead_code: hit[0].lead_code, client_name: hit[0].client_name }); setSaving(false); return; }
      }
    }
    const { error } = await supabase.from("leads").update(changes).eq("id", lead.id);
    if (error) { setErr2(/permission|protected/i.test(error.message || "") ? "You do not have permission to edit one of those fields." : "Could not save your changes. Please try again."); setSaving(false); return; }
    setDupEdit(null);
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
    if (error) { setErr2(/closed_locked/.test(error.message || "") ? "This lead is closed \u2014 only a Master Admin can reassign it." : "Unable to reassign this lead. Please try again."); return; }
    if (makeOpen) { try { await supabase.from("leads").update({ closed_locked: false }).eq("id", lead.id); } catch (e) {} }
    await supabase.from("lead_ownership_history").insert({ lead_id: lead.id, from_agent: lead.assigned_agent || null, to_agent: newId, reason: reReason || null, changed_by: me.id });
    await supabase.from("lead_activity").insert({ lead_id: lead.id, actor_id: me.id, action: makeOpen ? "make_open" : "reassign", detail: { from: agentDisplay, to: newName, reason: reReason || null } });
    await supabase.from("admin_audit").insert({ action: "lead_reassigned", performed_by: me.id, affected_user: newId, old_value: { agent: agentDisplay }, new_value: { agent: newName }, detail: lead.client_name });
    if (newId) await supabase.from("notifications").insert({ user_id: newId, kind: "lead_assigned", title: "New lead assigned to you", body: lead.client_name + " — " + (lead.project || lead.area || "new lead"), link_screen: "live" });
    if (newId) pushNotify({ leadId: lead.id });   // phone push to the new assignee (best-effort)
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

  // Derive the lead's "next follow-up" from the EARLIEST still-pending follow-up (completed/cancelled
  // ones are excluded). If none remain pending, clear it to null so the lead shows "no follow-up".
  const recalcNextFup = async (list) => {
    const pend = (list || []).filter((f) => f.status === "scheduled" && f.due_at).sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
    const nf = pend[0]
      ? { next_followup_at: pend[0].due_at, next_followup: new Date(pend[0].due_at).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }) }
      : { next_followup_at: null, next_followup: null };
    try { await supabase.from("leads").update(nf).eq("id", lead.id); setLead((l) => ({ ...l, ...nf })); } catch (e) {}
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
      setFups(fs || []); await recalcNextFup(fs); loadTimeline();
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
      setFups(fs || []); await recalcNextFup(fs); loadTimeline();
    } catch (e) { setDoneBusy(false); setDoneErr("Unable to save. Please try again."); }
  };

  const ACT_LABEL = { view_number: "Viewed number", reveal_phone: "Viewed number", call: "Called", whatsapp: "WhatsApp", schedule: "Scheduled follow-up",
    comment: "Commented", lead_created: "Lead created", lead_created_ai: "Lead created (AI)", status_change: "Status changed", assign: "Assigned",
    reassign: "Reassigned", make_open: "Moved to Open Leads", field_change: "Updated", lead_edited: "Edited details", make_open_bulk: "Moved to open", view: "Viewed",
    followup_scheduled: "Scheduled follow-up", followup_rescheduled: "Rescheduled follow-up", followup_completed: "Completed follow-up", deal_closed: "Deal closed" };
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
  // Plain function (NOT an inline component) so the <input>/<select> reconciles by
  // stable DOM type and never remounts on re-render — keystrokes keep focus.
  const fieldRow = (def) => {
    const [fkey, label, type, opts] = def;
    const canThis = editing && editableKeys.includes(fkey);
    const val = lead[fkey];
    return <div key={fkey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13, gap: 12 }}>
      <span style={{ color: T.muted, flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>{label}{user && user.role === "agent" && LOCKED_FOR_AGENT.includes(fkey) && <Lock size={11} color={T.faint} />}</span>
      {canThis ? (
        (fkey === "phone" || fkey === "whatsapp")
          ? <div style={{ maxWidth: 240, width: "100%" }}><SmartPhoneInput value={form[fkey] || ""} onChange={(v) => setF(fkey, v)} placeholder={label} /></div>
        : type === "select" ? <select value={form[fkey] || ""} onChange={(e) => setF(fkey, e.target.value)} style={{ ...inp, maxWidth: 200 }}>
          <option value="">—</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : <input type={type === "date" ? "date" : "text"} value={form[fkey] || ""} onChange={(e) => setF(fkey, e.target.value)} style={{ ...inp, maxWidth: 200 }} />
      ) : <span style={{ fontWeight: 600, textAlign: "right", color: val ? T.ink : T.faint }}>{val || "Not added yet"}</span>}
    </div>;
  };
  const Btn = ({ icon: Ic, label, onClick, tone }) => <button onClick={onClick} style={{ flex: 1, minWidth: 84, display: "flex", flexDirection: "column",
    alignItems: "center", gap: 5, padding: "12px 8px", borderRadius: 12, border: `1px solid ${tone === "wa" ? WA : tone === "ok" ? T.ok : tone === "gold" ? T.goldEdge : T.hair}`,
    background: tone === "wa" ? "rgba(37,211,102,.12)" : tone === "ok" ? T.okSoft : tone === "gold" ? T.goldSoft : T.paper, color: tone === "wa" ? WA : tone === "ok" ? T.ok : tone === "gold" ? T.gold : T.ink, cursor: "pointer", fontFamily: UI, fontSize: 11.5, fontWeight: 700 }}>
    <Ic size={17} /> {label}</button>;

  return <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => go(backTo.screen)} style={{ ...miniBtn() }}>← {backTo.label}</button>
        {lead && lead.client_name && <button onClick={() => { try { window.dispatchEvent(new CustomEvent("amber-open", { detail: { lead, lookup: true } })); } catch (e) {} }} title="Search public/professional sources for this client" style={{ ...miniBtn(), borderColor: T.gold, color: T.gold }}><Search size={13} /> Look up client online</button>}
        {lead && lead.client_name && lead.email && <span style={{ fontSize: 10.5, color: T.muted, display: "inline-flex", alignItems: "center" }}>Using name + email domain for better match accuracy.</span>}
      </div>
      {sibs.length > 1 && sibIdx >= 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => prevLeadId && openLead(prevLeadId, sibs)} disabled={!prevLeadId} style={{ ...miniBtn(), opacity: prevLeadId ? 1 : 0.45, cursor: prevLeadId ? "pointer" : "default" }}>‹ Prev</button>
          <span style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap", fontWeight: 600 }}>{sibIdx + 1} of {sibs.length}</span>
          <button onClick={() => nextLeadId && openLead(nextLeadId, sibs)} disabled={!nextLeadId} style={{ ...miniBtn(), opacity: nextLeadId ? 1 : 0.45, cursor: nextLeadId ? "pointer" : "default" }}>Next ›</button>
        </div>
      )}
    </div>

    {/* header */}
    <div style={{ ...card, padding: "18px 20px", background: T.hero, border: "none", boxShadow: T.shadowLg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Av name={lead.client_name} size={48} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 21, color: "#fff" }}>{lead.client_name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.goldBright }}>{leadIdFmt}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, background: "rgba(255,255,255,.14)", color: "#fff", borderRadius: 6, padding: "2px 8px" }}>{statusText}</span>
            {lead.locked && <span title={"Locked: " + (lead.lock_reason || "")} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, background: "rgba(212,175,92,.22)", color: T.goldBright, borderRadius: 6, padding: "2px 8px" }}><Lock size={11} /> Locked</span>}
            {(lead.temperature === "Hot" || lead.temperature === "Very Hot") && <span style={{ fontSize: 10.5, fontWeight: 700, background: "rgba(225,90,80,.25)", color: "#ffd9d5", borderRadius: 6, padding: "2px 8px" }}>{lead.temperature}</span>}
            {(() => { const ls = leadScore(lead); return <span title="Lead score (0-100)" style={{ fontSize: 10.5, fontWeight: 700, background: "rgba(212,175,92,.22)", color: T.goldBright, borderRadius: 6, padding: "2px 8px" }}>★ {ls.score} · {ls.band}</span>; })()}
          </div>
        </div>
        <button onClick={askAmberLead} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(212,175,92,.18)", border: `1px solid ${T.goldEdge}`, color: "#fff", borderRadius: 999, padding: "9px 15px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}><Sparkle size={15} color={T.goldBright} /> Ask Amber</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 12, marginTop: 16 }}>
        <HeaderItem k="Lead type" v={lead.lead_type || "Buyer"} />
        <HeaderItem k="Assigned agent" v={agentDisplay} />
        <HeaderItem k="Source" v={lead.source || "—"} />
        <HeaderItem k="Last contact" v={lead.last_contacted || "—"} />
        <HeaderItem k="Created" v={lead.created_on || (lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "—")} />
      </div>
    </div>

    {/* action buttons */}
    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
      {!revealed && <Btn icon={Eye} label="View Number" onClick={reveal} />}
      {revealed && prevReveal && !isAdmin && <span style={{ alignSelf: "center", fontSize: 11, fontWeight: 600, color: T.muted, background: T.bone, border: `1px solid ${T.hair}`, borderRadius: 7, padding: "4px 9px" }}>Previously revealed</span>}
      {revealed && lead.phone && <Btn icon={Phone} label="Call" onClick={() => { logActivityReliable("call", lead, me && me.id); markContacted(); stampContactedReliable(lead.id, me && me.id); window.location.href = telHref(lead.phone); }} />}
      {(revealed || !mustRevealOpen) && lead.phone && <Btn icon={MessageCircle} label="WhatsApp" tone="wa" onClick={() => { logAction("whatsapp", lead, me && me.id); markContacted(); window.open(waHref(lead.phone), "_blank"); }} />}
      {revealed && lead.email && <Btn icon={Mail} label="Email" onClick={() => { logAction("email", lead, me && me.id); markContacted(); window.location.href = "mailto:" + lead.email; }} />}
      {user && user.role === "agent" && lead.is_open && <Btn icon={UserPlus} label="Assign to Me" tone="ok" onClick={doAssignSelf} />}
      <Btn icon={Calendar} label="Schedule Follow-Up" onClick={() => openSchedule(null)} />
      {canReassign && <Btn icon={UserPlus} label="Change Agent" tone="gold" onClick={() => { setReTo(lead.assigned_agent || ""); setReReason(""); setErr2(""); setReOpen(true); }} />}
      {(isAssignedAgent || isAdmin) && !lead.is_open && !lead.locked && !leadClosed && <Btn icon={Lock} label="Lock lead" tone="gold" onClick={() => { setLockReason(""); setErr2(""); setLockModal(true); }} />}
      {user && user.role === "agent" && isAssignedAgent && !lead.is_open && !lead.locked && lead.status !== "Closed Won" && <Btn icon={Unlock} label="Mark as Open" tone="gold" onClick={() => { setOpenReason(""); setErr2(""); setOpenModal(true); }} />}
      {canEdit && <Btn icon={editing ? X : Pencil} label={editing ? "Cancel" : "Edit details"} tone="gold" onClick={() => editing ? setEditing(false) : startEdit()} />}
      {canEdit && !leadClosed && <Btn icon={Coins} label={draftRow ? "Edit Draft" : "Close deal"} tone="ok" onClick={() => setShowDeal(true)} />}
    </div>
    {revealMsg && <div style={{ ...card, padding: "10px 14px", marginTop: 10, borderColor: T.warnSoft, background: T.warnSoft, color: T.warn, fontSize: 12.5, fontWeight: 600 }}>{revealMsg}</div>}
    {leadClosed && <div style={{ ...card, padding: "11px 14px", marginTop: 10, borderColor: T.okSoft, background: T.okSoft, color: T.ok, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Lock size={14} /> {lead.status === "Closed Won" ? "Closed Won" : "Closed \u2014 pending approval"} · locked to {lead.assigned_agent_name || "the closing agent"}. Only a Master Admin can reassign.</div>}
    {lead.locked && !leadClosed && <div style={{ ...card, padding: "11px 14px", marginTop: 10, borderColor: T.goldEdge, background: "rgba(212,175,92,.10)", color: T.gold, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Lock size={14} /> Locked · {lead.lock_reason}{lead.locked_at ? " · " + new Date(lead.locked_at).toLocaleDateString() : ""}</span>
      {(isAssignedAgent || isAdmin) && <button onClick={doUnlock} disabled={lockBusy} style={{ ...miniBtn() }}>{lockBusy ? "..." : "Unlock"}</button>}
    </div>}

    {lockModal && <Modal title="Lock this lead" onClose={() => setLockModal(false)}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>Locking keeps this lead assigned to you and out of the Open Leads pool while you work toward closing. Choose a reason; it's recorded in the lead history.</div>
      <label style={{ display: "block", marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Reason</span>
        <select value={lockReason} onChange={(e) => setLockReason(e.target.value)} style={inp}>
          <option value="">Select a reason...</option>
          {["EOI in Process", "Closed in the past", "Final Stage of closing"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      {err2 && <div style={{ fontSize: 12, color: T.bad, marginBottom: 10 }}>{err2}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setLockModal(false)} style={{ ...miniBtn() }}>Cancel</button>
        <button onClick={doLock} disabled={!lockReason || lockBusy} style={{ ...miniBtn(), borderColor: T.gold, color: lockReason ? T.gold : T.faint, fontWeight: 700 }}>{lockBusy ? "Locking..." : "Lock lead"}</button>
      </div>
    </Modal>}

    {openModal && <Modal title="Mark lead as Open" onClose={() => setOpenModal(false)}>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>This releases the lead into the Open Leads pool for another agent to pick up. You'll no longer be assigned to it, and this is recorded in the lead history.</div>
      <label style={{ display: "block", marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Reason (optional)</span>
        <select value={openReason} onChange={(e) => setOpenReason(e.target.value)} style={inp}>
          <option value="">Select a reason…</option>
          {["Not responsive", "Budget mismatch", "Not interested", "Wrong inquiry", "Another agent should try", "Other"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setOpenModal(false)} style={{ ...miniBtn() }}>Cancel</button>
        <button onClick={doMarkOpen} disabled={openBusy} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, opacity: openBusy ? .6 : 1 }}>{openBusy ? "Working…" : "Mark as Open"}</button>
      </div>
    </Modal>}

    {showDeal && <DealSubmit lead={lead} user={user} existing={draftRow || undefined} onClose={() => setShowDeal(false)} onDone={() => { setShowDeal(false); go("deals"); }} />}

    {editing && <div style={{ ...card, padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: T.goldSoft, borderColor: T.goldEdge }}>
      <span style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>Editing mode — {canEditAll ? "you can edit all fields" : "you can edit your lead's details"}. Changes are logged.</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setEditing(false)} style={{ ...miniBtn() }}>Cancel</button>
        <button onClick={saveEdit} disabled={saving} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "flex", alignItems: "center", gap: 6, opacity: saving ? .7 : 1 }}><Save size={14} /> {saving ? "Saving…" : "Save changes"}</button>
      </div>
    </div>}
    {err2 && <div style={{ ...card, padding: "10px 14px", marginTop: 10, borderColor: T.badSoft, color: T.bad, fontSize: 12.5 }}>{err2}</div>}
    {dupEdit && <div style={{ ...card, padding: 12, marginTop: 10, borderColor: T.warnSoft, background: T.warnSoft }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.warn }}>That number already belongs to another lead</div>
      <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
        {(dupEdit.client_name || "—")}{dupEdit.lead_code ? " · " + dupEdit.lead_code : ""}{dupEdit.assigned_agent_name ? " · " + dupEdit.assigned_agent_name : ""}{dupEdit.status ? " · " + dupEdit.status : ""}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {dupEdit.lead_id && <button onClick={() => { setDupEdit(null); setEditing(false); if (openLead) openLead(dupEdit.lead_id); }} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold }}>Open Existing Lead</button>}
        <button onClick={() => saveEdit(true)} style={{ ...miniBtn(), borderColor: T.warn, color: T.warn }}>Save anyway</button>
        <button onClick={() => setDupEdit(null)} style={{ ...miniBtn() }}>Cancel</button>
      </div>
    </div>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginTop: 14 }}>
      {/* contact + status */}
      <div style={{ ...card, padding: 16 }}>
        <SectionMini>Contact information</SectionMini>
        {revealed ? GROUPS.contact.map((d) => fieldRow(d))
          : <>{fieldRow(["client_name", "Client name", "text"])}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}><span style={{ color: T.muted }}>Phone</span><span style={{ fontWeight: 600 }}>•••••• (View Number)</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}><span style={{ color: T.muted }}>WhatsApp</span><span style={{ fontWeight: 600 }}>••••••</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.hairSoft}`, fontSize: 13 }}><span style={{ color: T.muted }}>Email</span><span style={{ fontWeight: 600 }}>••••••</span></div></>}
        <div style={{ height: 14 }} />
        <SectionMini>Lead status</SectionMini>
        {GROUPS.meta.filter((d) => canEditAll || d[0] !== "source").map((d) => fieldRow(d))}
      </div>
      {/* client profile + investment */}
      <div style={{ ...card, padding: 16 }}>
        <SectionMini>Client profile</SectionMini>
        {GROUPS.profile.map((d) => fieldRow(d))}
        <div style={{ height: 14 }} />
        <SectionMini>Investment requirement</SectionMini>
        {GROUPS.invest.map((d) => fieldRow(d))}
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
              <Av name={c.author?.full_name || agentNameFor(c.author_id) || "User"} size={24} />
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.author?.full_name || agentNameFor(c.author_id) || (c.author_id ? "User" : "Imported")}</span>
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
            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{t.actor?.full_name || agentNameFor(t.actor_id) || "System"} · {roleLabel(t.actor?.role)} · {when(t.created_at)}</div>
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
      const data = await fetchAllRows("leads", "id,lead_code,client_name,project,area,budget,status,temperature,assigned_agent_name,is_open,deal_value,next_followup,deleted", "created_at", false);
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
// ===== Central Agent Performance — all agents in one page, real logs only =====
// Calls / WhatsApp / Reveals (counted separately), deals closed + commission (approved deals only),
// call & WhatsApp target progress, and live attendance — switchable across Today/Week/Month/Quarter/Year (Dubai time).
function apShiftDate(ds, days) { const d = new Date(ds + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
function apPeriodStart(period, range) {
  const t = tgtTodayStr(); const Y = Number(t.slice(0, 4)); const M = Number(t.slice(5, 7));
  if (period === "custom") return (((range && range.from) || t)) + "T00:00:00+04:00";
  if (period === "today") return t + "T00:00:00+04:00";
  if (period === "lastweek") return apShiftDate(tgtMondayStr(), -7) + "T00:00:00+04:00";
  if (period === "week") return tgtMondayStr() + "T00:00:00+04:00";
  if (period === "quarter") { const qm = Math.floor((M - 1) / 3) * 3 + 1; return Y + "-" + String(qm).padStart(2, "0") + "-01T00:00:00+04:00"; }
  if (period === "year") return Y + "-01-01T00:00:00+04:00";
  return t.slice(0, 7) + "-01T00:00:00+04:00"; // month
}
function apInPeriod(ts, period, range) {
  const ds = tgtDubaiDate(ts); if (!ds) return false; const t = tgtTodayStr();
  if (period === "custom") return !!(range && range.from && range.to) && ds >= range.from && ds <= range.to;
  if (period === "today") return ds === t;
  if (period === "lastweek") { const lm = apShiftDate(tgtMondayStr(), -7), ls = apShiftDate(tgtMondayStr(), -1); return ds >= lm && ds <= ls; }
  if (period === "week") return ds >= tgtMondayStr() && ds <= t;
  if (period === "month") return ds.slice(0, 7) === t.slice(0, 7);
  if (period === "quarter") { const q = Math.floor((Number(t.slice(5, 7)) - 1) / 3); const dq = Math.floor((Number(ds.slice(5, 7)) - 1) / 3); return ds.slice(0, 4) === t.slice(0, 4) && dq === q; }
  if (period === "year") return ds.slice(0, 4) === t.slice(0, 4);
  return ds.slice(0, 7) === t.slice(0, 7);
}
async function apFetchSince(table, columns, dateCol, sinceIso) {
  const PAGE = 1000; let out = [], from = 0;
  for (let guard = 0; guard < 80; guard++) {
    const { data, error } = await supabase.from(table).select(columns).gte(dateCol, sinceIso).order(dateCol, { ascending: false }).range(from, from + PAGE - 1);
    if (error) throw error;
    out = out.concat(data || []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}
const AP_PERIODS = [["today", "Today"], ["week", "Week"], ["lastweek", "Last week"], ["month", "Month"], ["quarter", "Quarter"], ["year", "Year"]];
const AP_PERIOD_LABEL = { today: "today", week: "this week", lastweek: "last week", month: "this month", quarter: "this quarter", year: "this year" };
function ApMiniBar({ done, target, color }) {
  if (target == null || target <= 0) return <div style={{ fontSize: 10.5, color: T.faint }}>—</div>;
  const pct = Math.max(0, Math.min(100, Math.round((done / target) * 100)));
  const c = done >= target ? T.ok : (pct < 60 ? T.warn : (color || T.gold));
  return (
    <div style={{ minWidth: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 3 }}>
        <span>{done}/{target}</span><span style={{ color: c, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: T.hairSoft, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: c, borderRadius: 3, transition: "width .5s" }} />
      </div>
    </div>
  );
}

function RevealQuotaPanel({ onClose }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState({});
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [bulkVal, setBulkVal] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setErr(""); setMsg("");
    try {
      const { data, error } = await supabase.rpc("admin_reveal_usage");
      if (error) throw error;
      setRows(data || []);
    } catch (e) { setErr((e && e.message) || "Could not load reveal quotas."); setRows([]); }
  };
  useEffect(() => { load(); }, []);

  const apply = async (ids, opts) => {
    if (!ids || !ids.length) return;
    setBusy(true); setErr(""); setMsg("");
    try {
      const { data, error } = await supabase.rpc("admin_set_reveal_quota", {
        p_agent_ids: ids,
        p_weekly: (opts.weekly != null && opts.weekly !== "") ? Math.max(0, parseInt(opts.weekly, 10) || 0) : null,
        p_clear: !!opts.clear,
        p_reset: !!opts.reset,
      });
      if (error) throw error;
      if (data && data.error) throw new Error(data.error === "forbidden" ? "Only Master Admin can change limits." : data.error);
      setMsg(opts.reset ? ("Usage reset for " + ids.length + " agent(s).") : opts.clear ? "Reset to the global default limit." : ("Limit updated for " + ids.length + " agent(s)."));
      setEditId(null); setEditVal("");
      await load();
    } catch (e) { setErr((e && e.message) || "Update failed."); }
    setBusy(false);
  };

  const selIds = rows ? rows.filter((r) => sel[r.id]).map((r) => r.id) : [];
  const allOn = rows && rows.length > 0 && selIds.length === rows.length;
  const toggleAll = () => { if (!rows) return; if (allOn) setSel({}); else { const n = {}; rows.forEach((r) => { n[r.id] = true; }); setSel(n); } };
  const fmtReset = (t) => t ? new Date(t).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "2-digit" }) : "\u2014";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,18,15,.55)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "4vh 12px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 900, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", borderBottom: `1px solid ${T.hairSoft}`, background: T.bone }}>
          <Eye size={18} color={T.gold} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, color: T.ink }}>Weekly reveal quotas</div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>Contact reveals each agent may make per rolling 7 days. Admins are unlimited.</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>

        {msg && <div style={{ padding: "8px 18px", fontSize: 12.5, color: T.ok, background: T.okSoft }}>{msg}</div>}
        {err && <div style={{ padding: "8px 18px", fontSize: 12.5, color: T.bad, background: T.badSoft }}>{err}</div>}

        {selIds.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 18px", borderBottom: `1px solid ${T.hairSoft}`, background: T.paper }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{selIds.length} selected</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: T.muted }}>Set weekly limit to</span>
              <input type="number" min={0} value={bulkVal} onChange={(e) => setBulkVal(e.target.value)} placeholder="e.g. 300" style={{ width: 92, border: `1px solid ${T.hair}`, borderRadius: 8, padding: "6px 9px", fontSize: 12.5, fontFamily: UI, color: T.ink, background: T.paper }} />
              <button disabled={busy || bulkVal === ""} onClick={() => { apply(selIds, { weekly: bulkVal }); setBulkVal(""); }} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold, opacity: (busy || bulkVal === "") ? 0.5 : 1 }}>Apply to selected</button>
            </span>
            <button disabled={busy} onClick={() => apply(selIds, { clear: true })} style={{ ...miniBtn(), opacity: busy ? 0.5 : 1 }}>Set to default</button>
            <button disabled={busy} onClick={() => apply(selIds, { reset: true })} style={{ ...miniBtn(), opacity: busy ? 0.5 : 1 }}>Reset usage</button>
            <button onClick={() => setSel({})} style={{ ...miniBtn() }}>Clear</button>
          </div>
        )}

        <div style={{ maxHeight: "62vh", overflowY: "auto", overflowX: "auto" }}>
          {rows === null ? <div style={{ padding: 24, color: T.muted, fontSize: 13 }}>Loading\u2026</div>
            : rows.length === 0 ? <div style={{ padding: 24, color: T.muted, fontSize: 13 }}>{err ? "" : "No agents found."}</div>
            : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 620 }}>
              <thead>
                <tr style={{ background: T.bone, color: T.muted, textAlign: "left" }}>
                  <th style={{ padding: "9px 10px 9px 18px", width: 30 }}><input type="checkbox" checked={!!allOn} onChange={toggleAll} /></th>
                  <th style={{ padding: "9px 8px" }}>Agent</th>
                  <th style={{ padding: "9px 8px" }}>Limit / week</th>
                  <th style={{ padding: "9px 8px" }}>Used</th>
                  <th style={{ padding: "9px 8px" }}>Remaining</th>
                  <th style={{ padding: "9px 8px" }}>Last reset</th>
                  <th style={{ padding: "9px 18px 9px 8px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const editing = editId === r.id;
                  const low = r.remaining <= 20;
                  return (
                    <tr key={r.id} style={{ borderTop: `1px solid ${T.hairSoft}` }}>
                      <td style={{ padding: "9px 10px 9px 18px" }}><input type="checkbox" checked={!!sel[r.id]} onChange={(e) => setSel((p) => ({ ...p, [r.id]: e.target.checked }))} /></td>
                      <td style={{ padding: "9px 8px" }}>
                        <div style={{ fontWeight: 700, color: T.ink }}>{r.full_name || "\u2014"}</div>
                        <div style={{ fontSize: 10.5, color: T.faint }}>{roleLabel(r.role)}{r.active === false ? " \u00b7 inactive" : ""}</div>
                      </td>
                      <td style={{ padding: "9px 8px" }}>
                        {editing ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <input type="number" min={0} autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && editVal !== "") apply([r.id], { weekly: editVal }); if (e.key === "Escape") { setEditId(null); setEditVal(""); } }} style={{ width: 82, border: `1px solid ${T.hair}`, borderRadius: 8, padding: "5px 8px", fontSize: 12.5, fontFamily: UI, color: T.ink, background: T.paper }} />
                            <button disabled={busy || editVal === ""} onClick={() => apply([r.id], { weekly: editVal })} style={{ ...miniBtn(), padding: "5px 9px", borderColor: T.gold, color: T.gold, opacity: (busy || editVal === "") ? 0.5 : 1 }}>Save</button>
                            <button onClick={() => { setEditId(null); setEditVal(""); }} style={{ ...miniBtn(), padding: "5px 9px" }}>Cancel</button>
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <b style={{ color: T.ink }}>{r.effective_limit}</b>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 6, color: r.is_custom ? T.gold : T.faint, background: r.is_custom ? (T.warnSoft) : T.hairSoft }}>{r.is_custom ? "custom" : "default"}</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "9px 8px", color: T.inkSoft }}>{r.used_week}</td>
                      <td style={{ padding: "9px 8px", color: low ? T.bad : T.inkSoft, fontWeight: low ? 700 : 500 }}>{r.remaining}</td>
                      <td style={{ padding: "9px 8px", color: T.muted }}>{fmtReset(r.reset_at)}</td>
                      <td style={{ padding: "9px 18px 9px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                        {!editing && (<span>
                          <button onClick={() => { setEditId(r.id); setEditVal(String(r.effective_limit)); }} style={{ ...miniBtn(), padding: "5px 9px" }}>Edit</button>
                          {r.is_custom && <button disabled={busy} onClick={() => apply([r.id], { clear: true })} title="Use the global default" style={{ ...miniBtn(), padding: "5px 9px", marginLeft: 6 }}>Default</button>}
                          <button disabled={busy} onClick={() => apply([r.id], { reset: true })} title="Reset this week's usage" style={{ ...miniBtn(), padding: "5px 9px", marginLeft: 6 }}>Reset</button>
                        </span>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: "10px 18px", borderTop: `1px solid ${T.hairSoft}`, fontSize: 10.5, color: T.faint, lineHeight: 1.5 }}>
          The limit caps contact reveals over a rolling 7-day window. "Reset" starts this agent's week from now (the reveal history and audit log are preserved). Raising a limit never grants access to leads an agent is not already allowed to see.
        </div>
      </div>
    </div>
  );
}

function AgentPerformance({ user, go, openAgent }) {
  const isMaster = !!(user && user.role === "master_admin");
  const canView = !!(user && (user.role === "master_admin" || user.role === "admin"));
  const canSeeCommission = isMaster;
  const [period, setPeriod] = useState("today");
  const [cf, setCf] = useState(""); const [ct, setCt] = useState("");
  const [sort, setSort] = useState("calls");
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [state, setState] = useState({ loading: true, rows: [], err: "" });
  const [quotaOpen, setQuotaOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!canView) { setState({ loading: false, rows: [], err: "" }); return; }
    (async () => {
      setState((s) => ({ ...s, loading: true, err: "" }));
      try {
        const since = apPeriodStart(period, { from: cf, to: ct });
        const [profR, actR, devR, defR, ovR, dealR] = await Promise.all([
          supabase.from("profiles").select("id,full_name,role,active,last_login,avatar_url").limit(2000),
          apFetchSince("lead_activity", "actor_id,action,created_at", "created_at", since),
          supabase.from("user_devices").select("user_id,last_seen,revoked").limit(3000),
          supabase.from("default_agent_targets").select("*").eq("id", 1).maybeSingle(),
          supabase.from("agent_targets").select("*").limit(2000),
          supabase.from("deals").select("agent_id,status,gross_commission,net_commission,company_share,final_net,decided_at,deleted").eq("status", "approved").gte("decided_at", since).limit(5000),
        ]);
        if (!alive) return;
        const profs = (profR.data || []).filter((p) => AP_STAFF_ROLES.includes(p.role));
        const acts = actR || [];
        const devs = devR.data || [];
        const defs = (defR && defR.data) || TARGET_DEFAULTS;
        const ovById = {}; ((ovR && ovR.data) || []).forEach((o) => { ovById[o.agent_id] = o; });
        const deals = ((dealR && dealR.data) || []).filter((d) => !d.deleted && apInPeriod(d.decided_at, period, { from: cf, to: ct }));
        const isRev = (a) => a === "view_number" || a === "reveal_phone";
        const byActor = {}; acts.forEach((a) => { (byActor[a.actor_id] = byActor[a.actor_id] || []).push(a); });
        const devByUser = {}; devs.forEach((d) => { (devByUser[d.user_id] = devByUser[d.user_id] || []).push(d); });
        const dealByAgent = {}; deals.forEach((d) => { (dealByAgent[d.agent_id] = dealByAgent[d.agent_id] || []).push(d); });
        const now = Date.now();
        const tkey = period === "today" ? "today" : period === "week" ? "week" : period === "month" ? "month" : null;
        const rows = profs.map((p) => {
          const ta = (byActor[p.id] || []).filter((a) => apInPeriod(a.created_at, period, { from: cf, to: ct }));
          const calls = ta.filter((a) => a.action === "call").length;
          const wa = ta.filter((a) => a.action === "whatsapp").length;
          const reveals = ta.filter((a) => isRev(a.action)).length;
          const md = dealByAgent[p.id] || [];
          const dealsClosed = md.length;
          const netAmber = md.reduce((s, d) => s + (Number(d.company_share != null ? d.company_share : (d.final_net != null ? d.final_net : d.net_commission)) || 0), 0);
          const myDevs = devByUser[p.id] || [];
          const activeNow = myDevs.some((dd) => !dd.revoked && dd.last_seen && (now - new Date(dd.last_seen)) < 30 * 60 * 1000);
          const days = new Set(ta.map((a) => tgtDubaiDate(a.created_at)));
          const seenToday = (byActor[p.id] || []).some((a) => tgtDubaiDate(a.created_at) === tgtTodayStr());
          const lastTimes = [p.last_login].concat((byActor[p.id] || []).map((a) => a.created_at)).concat(myDevs.map((d) => d.last_seen)).filter(Boolean);
          const lastActive = lastTimes.length ? lastTimes.reduce((m, t) => (new Date(t) > new Date(m) ? t : m)) : null;
          const tg = resolveTargets(defs, ovById[p.id]);
          const callTarget = tkey ? tg.call[tkey] : null;
          const waTarget = tkey ? tg.whatsapp[tkey] : null;
          const behind = callTarget != null && calls < callTarget;
          const warn = reveals >= 5 && (calls + wa) < reveals * 0.5;
          return { id: p.id, full_name: p.full_name, role: p.role, active: p.active, avatar_url: p.avatar_url, calls, wa, reveals, dealsClosed, netAmber, activeNow, activeDays: days.size, seenToday, lastActive, callTarget, waTarget, behind, warn };
        });
        setState({ loading: false, rows, err: "" });
      } catch (e) { if (alive) setState({ loading: false, rows: [], err: (e && e.message) || "Could not load performance." }); }
    })();
    return () => { alive = false; };
  }, [period, cf, ct, canView]);

  if (!canView) return <div style={{ ...card, padding: 22, maxWidth: 560, margin: "8px auto" }}>
    <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 800, color: T.ink }}>Access restricted</div>
    <div style={{ fontSize: 13, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>The all-agent performance view is available to Master Admin and Admin. A scoped team view for Managers is planned for a later update.</div>
  </div>;

  const { loading, rows, err } = state;
  const ql = q.trim().toLowerCase();
  let view = rows.filter((r) =>
    (roleF === "all" || r.role === roleF) &&
    (!ql || String(r.full_name || "").toLowerCase().includes(ql)) &&
    (statusF === "all"
      || (statusF === "active" && r.activeNow)
      || (statusF === "present" && r.seenToday)
      || (statusF === "offline" && !r.activeNow && !r.seenToday)
      || (statusF === "behind" && r.behind)
      || (statusF === "warn" && r.warn)));
  const sortFns = {
    calls: (a, b) => b.calls - a.calls, wa: (a, b) => b.wa - a.wa, reveals: (a, b) => b.reveals - a.reveals,
    deals: (a, b) => b.dealsClosed - a.dealsClosed, commission: (a, b) => b.netAmber - a.netAmber,
    behind: (a, b) => (b.behind - a.behind) || (a.calls - b.calls),
    active: (a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0),
    low: (a, b) => (a.calls + a.wa + a.reveals) - (b.calls + b.wa + b.reveals),
  };
  view = [...view].sort((a, b) => (b.activeNow - a.activeNow) || (sortFns[sort] || sortFns.calls)(a, b));

  const tot = (k) => rows.reduce((s, r) => s + r[k], 0);
  const T_active = rows.filter((r) => r.activeNow).length;
  const T_behind = (period === "today" || period === "week" || period === "month") ? rows.filter((r) => r.behind).length : null;
  const plabel = period === "custom" ? ((cf && ct) ? (cf + " → " + ct) : "custom range") : AP_PERIOD_LABEL[period];

  const SumCard = ({ label, value, tone, icon }) => (
    <div style={{ ...card, padding: "13px 15px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: T.muted }}>{icon}{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 800, color: tone || T.ink, marginTop: 5 }}>{value}</div>
    </div>
  );
  const sel = (val, set, opts) => (
    <select value={val} onChange={(e) => set(e.target.value)} style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid " + T.hair, background: T.paper, color: T.ink, fontSize: 12.5, fontFamily: UI, cursor: "pointer" }}>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  const Chip2 = ({ icon, label, value, color }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>
      <span style={{ color: color || T.muted, display: "inline-flex" }}>{icon}</span>{value}<span style={{ color: T.faint, fontWeight: 500, fontSize: 11 }}>{label}</span>
    </span>
  );

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <SectionTitle right={(isMaster || (user && (user.role === "admin" || user.role === "sales_manager"))) ? <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{isMaster && <button onClick={() => setQuotaOpen(true)} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold }}>Reveal quotas</button>}<button onClick={() => go("targets")} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold }}>Manage targets</button></span> : null}>Agent Performance</SectionTitle>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 13, alignItems: "center" }}>
        {AP_PERIODS.map(([p, l]) => {
          const on = period === p;
          return <button key={p} onClick={() => setPeriod(p)} style={{ padding: "7px 15px", borderRadius: 9, border: "1px solid " + (on ? T.gold : T.hair), background: on ? T.gold : T.paper, color: on ? "#fff" : T.muted, fontSize: 12.5, fontWeight: 700, fontFamily: UI, cursor: "pointer" }}>{l}</button>;
        })}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px 4px 10px", borderRadius: 9, border: "1px solid " + (period === "custom" ? T.gold : T.hair), background: period === "custom" ? T.goldSoft : T.paper }}>
          <Calendar size={14} color={period === "custom" ? T.gold : T.muted} />
          <input type="date" value={cf} max={ct || undefined} onChange={(e) => setCf(e.target.value)} title="From date" style={{ border: "none", background: "transparent", color: T.ink, fontSize: 12, fontFamily: UI, cursor: "pointer" }} />
          <span style={{ color: T.faint, fontSize: 12 }}>→</span>
          <input type="date" value={ct} min={cf || undefined} onChange={(e) => setCt(e.target.value)} title="To date" style={{ border: "none", background: "transparent", color: T.ink, fontSize: 12, fontFamily: UI, cursor: "pointer" }} />
          <button onClick={() => { if (cf && ct && cf <= ct) setPeriod("custom"); }} disabled={!(cf && ct && cf <= ct)} style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: (cf && ct && cf <= ct) ? T.gold : T.hair, color: (cf && ct && cf <= ct) ? "#fff" : T.muted, fontSize: 12, fontWeight: 700, fontFamily: UI, cursor: (cf && ct && cf <= ct) ? "pointer" : "default" }}>Apply</button>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(138px,1fr))", gap: 11, marginBottom: 15 }}>
        <SumCard label={"Calls " + plabel} value={tot("calls")} icon={<PhoneCall size={13} />} />
        <SumCard label={"WhatsApp " + plabel} value={tot("wa")} tone={WA} icon={<MessageCircle size={13} />} />
        <SumCard label={"Reveals " + plabel} value={tot("reveals")} icon={<Eye size={13} />} />
        <SumCard label={"Deals closed " + plabel} value={tot("dealsClosed")} tone={T.gold} icon={<BarChart3 size={13} />} />
        {canSeeCommission && <SumCard label={"Net to Amber " + plabel} value={apMoney(tot("netAmber"))} tone={T.gold} icon={<TrendingUp size={13} />} />}
        <SumCard label="Active now" value={T_active} tone={T.ok} icon={<Users size={13} />} />
        {T_behind != null && <SumCard label="Behind call target" value={T_behind} tone={T_behind ? T.warn : T.ink} icon={<Target size={13} />} />}
      </div>

      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 13, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.faint }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agent…" style={{ width: "100%", padding: "9px 12px 9px 33px", borderRadius: 9, border: "1px solid " + T.hair, background: T.paper, color: T.ink, fontSize: 13, fontFamily: UI, boxSizing: "border-box" }} />
        </div>
        {sel(sort, setSort, [["calls", "Sort: Calls"], ["wa", "Sort: WhatsApp"], ["reveals", "Sort: Reveals"], ["deals", "Sort: Deals closed"], ...(canSeeCommission ? [["commission", "Sort: Commission"]] : []), ["behind", "Sort: Behind target"], ["active", "Sort: Last active"], ["low", "Sort: Lowest activity"]])}
        {sel(roleF, setRoleF, [["all", "All roles"], ["agent", "Agent"], ["sales_manager", "Sales Manager"], ["admin", "Admin"], ["master_admin", "Master Admin"]])}
        {sel(statusF, setStatusF, [["all", "All status"], ["active", "Active now"], ["present", "Seen today"], ["offline", "Offline"], ["behind", "Behind target"], ["warn", "High reveals, low contact"]])}
      </div>

      {err ? <div style={{ ...card, padding: 16, color: T.bad, fontSize: 13 }}>{err}</div>
        : loading ? <div style={{ padding: 24, color: T.muted }}>Loading agent performance…</div>
        : view.length === 0 ? <div style={{ ...card, padding: 20, color: T.muted, fontSize: 13, textAlign: "center" }}>No agents match.</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {view.map((r) => (
            <div key={r.id} style={{ ...card, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <ApAvatar url={r.avatar_url} name={r.full_name} size={44} />
                <div style={{ minWidth: 150, flex: "1 1 180px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{r.full_name || "—"}</span>
                    {r.warn && <span title="High reveals, low calls/WhatsApp" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 700, color: T.warn, background: T.warnSoft, padding: "2px 6px", borderRadius: 6 }}><AlertTriangle size={11} /> Low contact</span>}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{roleLabel(r.role)}{r.active === false ? " · inactive" : ""}</div>
                </div>
                <div style={{ minWidth: 116, fontSize: 11, color: T.muted }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: r.activeNow ? T.ok : (r.seenToday ? T.gold : T.faint), display: "inline-block" }} />{r.activeNow ? "Active now" : (r.seenToday ? "Seen today" : "Offline")}</div>
                  <div style={{ marginTop: 3 }}>{apFmtAgo(r.lastActive)}{period !== "today" ? " · " + r.activeDays + "d active" : ""}</div>
                </div>
                <div style={{ flex: "2 1 300px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <Chip2 icon={<PhoneCall size={13} />} value={r.calls} label="calls" />
                  <Chip2 icon={<MessageCircle size={13} />} value={r.wa} label="wa" color={WA} />
                  <Chip2 icon={<Eye size={13} />} value={r.reveals} label="reveals" />
                  <Chip2 icon={<BarChart3 size={13} />} value={r.dealsClosed} label="deals" color={T.gold} />
                  {canSeeCommission && <span style={{ fontSize: 12.5, fontWeight: 700, color: T.gold }}>{apMoney(r.netAmber)}</span>}
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <div><div style={{ fontSize: 9, color: T.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Calls</div><ApMiniBar done={r.calls} target={r.callTarget} /></div>
                  <div><div style={{ fontSize: 9, color: T.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>WhatsApp</div><ApMiniBar done={r.wa} target={r.waTarget} color={WA} /></div>
                  <button onClick={() => openAgent(r.id)} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>Details <ChevronRight size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>}

      <div style={{ fontSize: 10.5, color: T.faint, marginTop: 10, lineHeight: 1.5 }}>
        All counts are real action logs in Dubai time. Calls = call actions, WhatsApp = WhatsApp actions, Reveals = contact-number reveals — counted separately. Deals closed and Net to Amber come only from <b>approved</b> deals in the Deals module (hot resale / listings are never counted). Call / WhatsApp target bars apply to Today / Week / Month.{canSeeCommission ? "" : " Commission is hidden for your role."}
      </div>
      {quotaOpen && <RevealQuotaPanel onClose={() => setQuotaOpen(false)} />}
    </div>
  );
}

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
        supabase.from("profiles").select("id,full_name,role,active,last_login,avatar_url"),
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
      const build = (name, id, role, active, lastLogin, imported, avatar) => {
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
        return { name, id, role, active, lastLogin, imported, avatar: avatar || null, assigned, contacted, won, overdue, due, calls, wa, reveals, submitted, approved, conv };
      };
      const accountRows = profs.filter((p) => p.role === "agent" || p.role === "sales_manager")
        .map((p) => build(p.full_name, p.id, p.role, p.active, p.last_login, false, p.avatar_url));
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
                      <Av name={r.name} src={r.avatar || undefined} size={26} round />
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
  const [shared, setShared] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("user_devices").select("device_id, user_id, label, last_ip, city, region, country, last_seen").order("last_seen", { ascending: false }).limit(2000);
        const rows = data || [];
        const byDev = {};
        rows.forEach((r) => { (byDev[r.device_id] = byDev[r.device_id] || []).push(r); });
        const groups = Object.values(byDev).map((list) => ({ list, users: [...new Set(list.map((x) => x.user_id))] })).filter((g) => g.users.length >= 2);
        const ids = [...new Set(groups.flatMap((g) => g.users))];
        const names = {};
        if (ids.length) { const { data: p } = await supabase.from("profiles").select("id, full_name").in("id", ids); (p || []).forEach((x) => { names[x.id] = x.full_name; }); }
        setShared(groups.map((g) => ({ users: g.users, names: g.users.map((u) => names[u] || "Unknown"), rep: g.list[0] })));
      } catch (e) { setShared([]); }
    })();
  }, []);
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
    <div style={{ ...card, padding: 16, marginBottom: 14, borderColor: shared && shared.length ? T.badSoft : T.hair }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Smartphone size={16} color={T.gold} /> Devices used by multiple accounts</div>
      {shared === null ? <div style={{ color: T.muted, fontSize: 12.5 }}>Checking devices…</div>
        : shared.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5 }}>No device is signed into by more than one account.</div>
        : <div style={{ display: "grid", gap: 10 }}>{shared.map((g, i) => (
            <div key={i} style={{ background: T.badSoft, borderRadius: 10, padding: "10px 13px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.bad }}><AlertTriangle size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> {g.users.length} accounts on one device: {g.names.join(", ")}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{(g.rep.label || "Device")} · IP {g.rep.last_ip || "—"} · {[g.rep.city, g.rep.country].filter(Boolean).join(", ") || "location n/a"} · last seen {g.rep.last_seen ? new Date(g.rep.last_seen).toLocaleString() : "—"}</div>
            </div>))}</div>}
    </div>
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
function OpenLeadsAutomation() {
  const [s, setS] = useState(undefined);  // undefined = loading, null = table missing
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");
  const load = async () => {
    const { data, error } = await supabase.from("open_leads_settings").select("*").eq("id", true).maybeSingle();
    setS(error ? null : (data || null));
  };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setS((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setSaving(true); setMsg("");
    const { data: { user: au } } = await supabase.auth.getUser();
    const { error } = await supabase.from("open_leads_settings").update({
      auto_open_enabled: s.auto_open_enabled, inactivity_days: Math.max(1, Number(s.inactivity_days) || 15),
      apply_buyer: s.apply_buyer, apply_seller: s.apply_seller, apply_tenant: s.apply_tenant, apply_agent: s.apply_agent,
      respect_future_followups: s.respect_future_followups, view_counts_as_activity: s.view_counts_as_activity,
      notify_admin_after: s.notify_admin_after, notify_agent_before: s.notify_agent_before,
      updated_at: new Date().toISOString(), updated_by: au?.id || null,
    }).eq("id", true);
    setMsg(error ? "Save failed — Master Admin only." : "Settings saved.");
    setSaving(false);
  };
  const runNow = async () => {
    setRunning(true); setMsg("");
    const { data, error } = await supabase.rpc("auto_open_stale_leads");
    setMsg(error ? ("Run failed: " + (error.message || "permission")) : (Number(data) === 0 ? "Ran — no leads needed opening." : "Ran — " + data + " lead(s) moved to Open."));
    setRunning(false);
  };

  const Toggle = ({ on, onClick }) => (
    <button onClick={onClick} style={{ width: 40, height: 23, borderRadius: 999, border: "none", cursor: "pointer",
      background: on ? T.ok : T.hair, position: "relative", transition: "background .15s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2, left: on ? 19 : 2, width: 19, height: 19, borderRadius: 999, background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} />
    </button>
  );
  const row = (label, sub, k) => (
    <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: `1px solid ${T.hairSoft}` }}>
      <div><div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{label}</div><div style={{ fontSize: 11, color: T.muted }}>{sub}</div></div>
      <Toggle on={!!s[k]} onClick={() => set(k, !s[k])} />
    </div>
  );

  return <div style={{ marginBottom: 22 }}>
    <SectionTitle right={<button onClick={runNow} disabled={running || !s} style={{ background: "none", border: `1px solid ${T.gold}`, color: T.gold, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: running ? "default" : "pointer", fontFamily: UI, opacity: running ? .6 : 1 }}>{running ? "Running…" : "Run automation now"}</button>}>Open Leads automation</SectionTitle>
    {s === undefined ? <div style={{ ...card, padding: 20, color: T.muted }}>Loading…</div>
     : s === null ? <div style={{ ...card, padding: 18, borderColor: T.warnSoft, background: T.warnSoft }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.warn }}>Automation not enabled yet</div>
        <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}>Run migration <b>20_lead_type_and_open_leads.sql</b> in Supabase to create the settings and the auto-open function. Until then, leads can still be opened manually.</div>
      </div>
     : <div style={{ ...card, padding: "16px 18px" }}>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 6, lineHeight: 1.5 }}>Automatically moves inactive leads to the Open pool for redistribution. Only the lead types you enable below are ever auto-opened; Closed Won, deal-pending and other excluded statuses are always protected, and leads with a future follow-up are left alone.</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0" }}>
          <div><div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>Auto-open enabled</div><div style={{ fontSize: 11, color: T.muted }}>Master switch for the automation</div></div>
          <Toggle on={!!s.auto_open_enabled} onClick={() => set("auto_open_enabled", !s.auto_open_enabled)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: `1px solid ${T.hairSoft}` }}>
          <div><div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>Inactivity days</div><div style={{ fontSize: 11, color: T.muted }}>Open after this many days with no meaningful activity</div></div>
          <input type="number" min={1} value={s.inactivity_days} onChange={(e) => set("inactivity_days", e.target.value)} style={{ width: 70, border: `1px solid ${T.hair}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: UI, textAlign: "center", background: T.bone }} />
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted, marginTop: 12, marginBottom: 2 }}>Apply to lead types</div>
        {row("Buyer leads", "Recommended — the main pool for redistribution", "apply_buyer")}
        {row("Seller leads", "Off by default", "apply_seller")}
        {row("Tenant leads", "Off by default", "apply_tenant")}
        {row("Agent leads", "Off by default", "apply_agent")}
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.muted, marginTop: 12, marginBottom: 2 }}>Rules</div>
        {row("Respect future follow-ups", "Never open a lead that has a scheduled future follow-up", "respect_future_followups")}
        {row("Lead view counts as activity", "If off, only calls/WhatsApp/email/comments/edits reset the timer", "view_counts_as_activity")}
        {row("Notify admin after opening", "Record an audit entry when a lead is auto-opened", "notify_admin_after")}
        <div style={{ marginTop: 12, padding: "10px 12px", background: T.bone, borderRadius: 9, fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
          <b style={{ color: T.inkSoft }}>Always protected (never auto-opened):</b> {(s.exclude_statuses || []).join(" · ")} — plus any lead tied to a submitted, pending or approved deal.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <button onClick={save} disabled={saving} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer", fontFamily: UI, opacity: saving ? .6 : 1 }}>{saving ? "Saving…" : "Save settings"}</button>
          {msg && <span style={{ fontSize: 12.5, fontWeight: 600, color: /fail/i.test(msg) ? T.bad : T.ok }}>{msg}</span>}
        </div>
      </div>}
  </div>;
}
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
    <OpenLeadsAutomation />
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
const KB_CATEGORIES = ["Founder's Knowledge","Company Overview","Awards and Recognition","Developer Relationships","Services","Sales Scripts","WhatsApp Templates","Area Knowledge","Project Knowledge","Developer Knowledge","Investment Guidance","Golden Visa Guidance","Internal Policies","CRM Usage","Objection Handling","Compliance / Do Not Say","Market Updates","FAQs","Agent Training","AI Behavior Rules","WhatsApp New Lead Responses","Call Conversion Scripts","Client Qualification","Off-Plan Sales Knowledge","Ready Property Knowledge","Luxury Property Knowledge","Villa and Townhouse Knowledge","Holiday Home Knowledge","Dubai Market Knowledge","Golden Visa Knowledge","Community Knowledge","Follow-Up Scripts","Meeting and Site Visit Scripts","EOI and Booking Process","Closing Language","Compliance and Do-Not-Say Rules","Master Prompt / AI System Behavior"];
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

function FounderUpdateModal({ onSave, onCancel, saving, err }) {
  const today = dubaiToday();
  const [f, setF] = useState({ weekOf: today, title: "", marketSummary: "", whatChanged: "", buyerSentiment: "", launchActivity: "", developerFocus: "", areasFocus: "", projectsPush: "", projectsCareful: "", talkingPoints: "", whatsappScript: "", objectionHandling: "", doNotSay: "", priority: 1, visibility: "agent_ok", review_date: "" });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const lbl = { fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" };
  const compose = () => {
    const L = ["Founder market update for the week of " + (f.weekOf || today) + "."];
    const add = (label, v) => { if (v && v.trim()) L.push(label + ": " + v.trim()); };
    add("Market summary", f.marketSummary); add("What changed this week", f.whatChanged);
    add("Buyer sentiment", f.buyerSentiment); add("Launch activity", f.launchActivity);
    add("Developer focus", f.developerFocus); add("Areas to focus", f.areasFocus);
    add("Projects to push", f.projectsPush); add("Projects to be careful with", f.projectsCareful);
    add("Agent talking points", f.talkingPoints); add("Suggested WhatsApp", f.whatsappScript);
    add("Client objection handling", f.objectionHandling); add("Do NOT say", f.doNotSay);
    L.push("(Amber Homes internal founder view — not a guarantee. Verify price/availability before promising anything to a client.)");
    return L.join("\n");
  };
  const submit = () => {
    const title = f.title.trim() || ("Founder Update — " + (f.weekOf || today));
    const tags = ["founder update", "weekly market update", "dubai market", f.areasFocus, f.developerFocus, f.projectsPush].filter(Boolean).join(", ").toLowerCase().slice(0, 300);
    onSave({ title, content: compose(), visibility: f.visibility, priority: f.priority, status: "active", source: "Founder Internal View", tags, review_date: f.review_date });
  };
  const fields = [
    ["marketSummary", "Market summary", "Your one-paragraph read on the Dubai market this week"],
    ["whatChanged", "What changed this week", "New launches, price moves, sentiment shifts, regulation, regional events"],
    ["buyerSentiment", "Buyer sentiment", "Are buyers cautious, value-seeking, urgent, waiting?"],
    ["launchActivity", "Launch activity", "Launch wave / slowdown, which developers are launching"],
    ["developerFocus", "Developer focus", "Which developers agents should lean into this week"],
    ["areasFocus", "Areas to focus", "Communities/areas to push this week"],
    ["projectsPush", "Projects to push", "Projects worth prioritising"],
    ["projectsCareful", "Projects to be careful with", "Where to be cautious"],
    ["talkingPoints", "Agent talking points", "The angles agents should use with clients"],
    ["whatsappScript", "Suggested WhatsApp", "A ready-to-send client message agents can adapt"],
    ["objectionHandling", "Client objection handling", "How to handle this week's common objections"],
    ["doNotSay", "Do NOT say", "Claims agents must avoid this week"],
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,15,25,.55)", zIndex: 80, display: "grid", placeItems: "center", padding: 16 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "min(680px, 96vw)", maxHeight: "92vh", overflowY: "auto", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 8 }}><Star size={18} color={T.gold} /> Weekly Founder Update</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.5 }}>This becomes a high-priority Founder's Knowledge entry that Ask Amber uses first. Fill what's relevant — blank fields are skipped. Ask Amber will frame it as your internal view, never as a guarantee.</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 150px" }}><label style={lbl}>Week of</label><input type="date" value={f.weekOf} onChange={(e) => set("weekOf", e.target.value)} style={kbInp} /></div>
          <div style={{ flex: "2 1 280px" }}><label style={lbl}>Title (optional)</label><input value={f.title} onChange={(e) => set("title", e.target.value)} style={kbInp} placeholder={"Founder Update — " + today} /></div>
        </div>
        {fields.map(([k, label, ph]) => (
          <div key={k} style={{ marginBottom: 11 }}>
            <label style={lbl}>{label}</label>
            <textarea value={f[k]} onChange={(e) => set(k, e.target.value)} rows={2} style={{ ...kbInp, resize: "vertical", lineHeight: 1.5 }} placeholder={ph} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px" }}><label style={lbl}>Priority</label>
            <select value={f.priority} onChange={(e) => set("priority", e.target.value)} style={kbInp}><option value={1}>High / Urgent</option><option value={2}>Normal</option><option value={3}>Low</option></select></div>
          <div style={{ flex: "1 1 180px" }}><label style={lbl}>Visibility</label>
            <select value={f.visibility} onChange={(e) => set("visibility", e.target.value)} style={kbInp}>{KB_VIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>Review date (optional)</label>
            <input type="date" value={f.review_date} onChange={(e) => set("review_date", e.target.value)} style={kbInp} /></div>
        </div>
        {err && <div style={{ background: T.badSoft, color: T.bad, padding: "9px 12px", borderRadius: 9, fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "10px 16px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, cursor: "pointer", fontWeight: 600, fontFamily: UI }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, cursor: saving ? "default" : "pointer", fontWeight: 700, fontFamily: UI, opacity: saving ? .7 : 1, display: "flex", alignItems: "center", gap: 7 }}><Save size={15} /> {saving ? "Publishing…" : "Publish founder update"}</button>
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
  const [showFounder, setShowFounder] = useState(false);
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

  // Weekly Founder Update: composes the structured founder fields into one Founder's Knowledge entry.
  const saveFounderUpdate = async (form) => {
    setSaving(true); setErr("");
    if (!form.title.trim() || !form.content.trim()) { setErr("Add at least a market summary."); setSaving(false); return; }
    try {
      const row = { title: form.title.trim(), category: "Founder's Knowledge", content: form.content.trim(),
        visibility: form.visibility, priority: Number(form.priority) || 1, status: "active",
        source: "Founder Internal View", tags: form.tags || "founder update, weekly market update",
        review_date: form.review_date || null, added_by: user.id, updated_by: user.id, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("ai_knowledge").insert(row);
      if (error) throw error;
      await audit("founder_update_added", row);
      setShowFounder(false); await load();
    } catch (e) { setErr("Save failed. Founder's Knowledge is editable by Master Admin only."); }
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
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => { setErr(""); setShowFounder(true); }} style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.gold}`, background: T.goldSoft, color: T.gold, cursor: "pointer", fontWeight: 700, fontFamily: UI, display: "flex", alignItems: "center", gap: 8 }}><Star size={15} /> Add Weekly Founder Update</button>
          <button onClick={() => { setErr(""); setEditing("new"); }} style={{ padding: "11px 18px", borderRadius: 10, border: "none", background: T.btnBg, color: T.btnFg, cursor: "pointer", fontWeight: 700, fontFamily: UI, display: "flex", alignItems: "center", gap: 8, boxShadow: T.shadow }}><Plus size={16} /> Add knowledge</button>
        </div>
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
        <button onClick={() => setCatF(catF === "Founder's Knowledge" ? "" : "Founder's Knowledge")} style={{ padding: "9px 13px", borderRadius: 9, border: `1px solid ${catF === "Founder's Knowledge" ? T.gold : T.hair}`, background: catF === "Founder's Knowledge" ? T.goldSoft : T.paper, color: catF === "Founder's Knowledge" ? T.gold : T.muted, cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: UI, display: "flex", alignItems: "center", gap: 6 }}><Star size={14} /> Founder's Knowledge</button>
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
      {showFounder && <FounderUpdateModal onSave={saveFounderUpdate} onCancel={() => setShowFounder(false)} saving={saving} err={err} />}
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

/* ============================ DATA CALLING ============================ */
// Owner/property cold-calling for listing acquisition. Agents work their assigned
// records (data_calling_agent_view = RLS-scoped to auth.uid()), reveal the owner's
// number (reveal_data_contact), place LOGGED Call/WhatsApp (keepalive insert to
// data_calling_activity, survives the dialer), and save a disposition via the
// data_calling_set_disposition RPC (agents can't write the base table directly).
const DC_OUTCOMES = [["no_answer","No answer"],["answered","Answered"],["interested","Interested"],["callback","Call back"],["not_interested","Not interested"],["wrong_number","Wrong number"],["dnc","Do not call"]];
const dcOutcomeLabel = (c) => { const o = DC_OUTCOMES.find(([k]) => k === c); return o ? o[1] : (c || "—"); };
const dcAed = (n) => (n != null && n !== "" && Number(n) > 0) ? "AED " + Number(n).toLocaleString() : "—";
const dcArea = (n) => (n != null && n !== "" && Number(n) > 0) ? Number(n).toLocaleString() + " sqft" : null;
const DC_STATUS_LABELS = { new: "New", in_progress: "In progress", converted: "Converted", dead: "Closed" };
const DC_OUTCOME_TO_STATUS = { no_answer: "in_progress", answered: "in_progress", interested: "in_progress", callback: "in_progress", not_interested: "in_progress", wrong_number: "dead", dnc: "dead" };
const DC_OUTCOME_TO_SALE = { wrong_number: "Wrong Number", dnc: "Not Valid Owner", not_interested: "Not Selling" };
const DC_ACTION_LABELS = { reveal: "revealed", call_click: "called", whatsapp_click: "WhatsApp", email_click: "emailed", comment: "note", status_change: "updated", follow_up_created: "follow-up", follow_up_completed: "follow-up done", assigned: "assigned", unassigned: "unassigned", converted: "converted" };
const dcActionLabel = (a) => DC_ACTION_LABELS[a] || a;
const dcMailHref = (e) => "mailto:" + (e || "");
const dcTimeAgo = (iso) => {
  if (!iso) return null;
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24); if (d < 30) return d + "d ago";
  return new Date(iso).toLocaleDateString();
};
const dcFollowLabel = (iso) => {
  if (!iso) return null;
  const d = new Date(iso); const days = Math.round((d - new Date()) / 86400000);
  const dateStr = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (days < 0) return "Overdue · " + dateStr;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return dateStr;
};
const dcPrimaryBtn = { padding: "9px 16px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, fontWeight: 700, fontFamily: UI, cursor: "pointer" };

function DcPill({ children, tone }) {
  const tones = {
    gold:  { fg: T.gold,  bd: T.goldEdge, bg: T.goldTint },
    good:  { fg: T.ok,    bd: T.hair,     bg: T.paper },
    warn:  { fg: T.warn,  bd: T.hair,     bg: T.paper },
    muted: { fg: T.muted, bd: T.hair,     bg: T.paper },
  };
  const t = tones[tone] || tones.muted;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, display: "inline-flex", alignItems: "center" }}>{children}</span>;
}

function DcStat({ n, label, tone }) {
  const c = tone === "ok" ? T.ok : tone === "warn" ? T.warn : tone === "bad" ? T.bad : T.ink;
  return (
    <div style={{ border: `1px solid ${T.hairSoft}`, borderRadius: 10, padding: "8px 14px", minWidth: 92, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{n}</div>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function DcDisposition({ r, user, onSaved }) {
  const [outcome, setOutcome] = useState("");
  const [sell, setSell] = useState(!!r.wants_to_sell);
  const [list, setList] = useState(!!r.wants_to_list);
  const [listed, setListed] = useState(!!r.listed_with_us);
  const [comment, setComment] = useState("");
  const [follow, setFollow] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async () => {
    setBusy(true); setMsg("");
    const status = outcome ? (DC_OUTCOME_TO_STATUS[outcome] || "in_progress") : null;
    const sale = sell ? "Selling" : (DC_OUTCOME_TO_SALE[outcome] || null);
    const { data, error } = await supabase.rpc("data_calling_set_disposition", {
      p_record_id: r.id, p_status: status,
      p_wants_to_sell: sell, p_wants_to_list: list, p_listed_with_us: listed,
      p_sale_status: sale, p_comment: comment || null,
      p_follow_up_at: follow ? new Date(follow).toISOString() : null });
    setBusy(false);
    if (error || (data && data.error)) {
      setMsg(data && data.error === "forbidden" ? "You can't update this record." : "Couldn't save — please try again."); return;
    }
    setComment(""); onSaved && onSaved();
  };
  const cbox = (val, set, label) => (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.ink, cursor: "pointer", padding: "5px 10px", border: `1px solid ${val ? T.gold : T.hair}`, borderRadius: 8, background: val ? T.goldTint : T.paper }}>
      <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  );
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${T.hair}` }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 180px" }}>
          <option value="">Call outcome…</option>
          {DC_OUTCOMES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="datetime-local" value={follow} onChange={(e) => setFollow(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 210px" }} title="Follow-up reminder (optional)" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {cbox(sell, setSell, "Wants to sell")}
        {cbox(list, setList, "Wants to list")}
        {cbox(listed, setListed, "Listed with us")}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note about this call…" rows={2} style={{ ...pInp, resize: "vertical", marginBottom: 10 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={save} disabled={busy} style={{ ...dcPrimaryBtn, opacity: busy ? .6 : 1, display: "inline-flex", alignItems: "center", gap: 7 }}><Check size={15} /> {busy ? "Saving…" : "Save disposition"}</button>
        {msg && <span style={{ fontSize: 12.5, color: T.bad }}>{msg}</span>}
      </div>
    </div>
  );
}

function DcCard({ r, user, canManage, onChanged }) {
  const [rv, setRv] = useState(null);
  const [open, setOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const reveal = async () => {
    if (rv || revealing) return;
    setRevealing(true);
    try {
      const { data, error } = await supabase.rpc("reveal_data_contact", { p_record_id: r.id });
      if (!error) {
        const row = Array.isArray(data) ? data[0] : data;
        if (row) { setRv(row); logDataCallReliable(r.id, "reveal", user.id); }
      }
    } catch (e) {}
    setRevealing(false);
  };
  const phone = rv && rv.owner_phone;
  const email = rv && rv.owner_email;
  const ar = dcArea(r.built_up_area);
  const showAgent = r.assigned_agent_name && (canManage || (r.is_open_calling && !r.assigned_to_me));
  const lastAct = dcTimeAgo(r.last_activity_at);
  const follow = dcFollowLabel(r.next_follow_up_at);
  const statusTone = r.status === "converted" ? "good" : r.status === "in_progress" ? "gold" : "muted";
  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 200, flex: "1 1 260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, color: T.ink, fontSize: 15 }}>{r.owner_name || "Unknown owner"}</span>
            {r.unit_number && <span style={{ fontSize: 12, color: T.muted }}>Unit {r.unit_number}</span>}
            <DcPill tone={statusTone}>{DC_STATUS_LABELS[r.status] || r.status || "New"}</DcPill>
            {r.is_open_calling && <DcPill tone="gold"><Unlock size={10} style={{ marginRight: 3 }} />Open Calling</DcPill>}
          </div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {r.project_location && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={12} />{r.project_location}</span>}
            {r.property_type && <span>{r.property_type}</span>}
            {ar && <span>{ar}</span>}
            {Number(r.selling_price) > 0 && <span>Ask {dcAed(r.selling_price)}</span>}
          </div>
          {(showAgent || lastAct || follow) && (
            <div style={{ fontSize: 12, color: T.faint, marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {showAgent && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><UserCircle size={12} />{r.assigned_agent_name}</span>}
              {lastAct && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Clock size={12} />{lastAct}{r.last_action ? " · " + dcActionLabel(r.last_action) : ""}</span>}
              {follow && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: /Overdue/.test(follow) ? T.bad : T.faint }}><Calendar size={12} />{follow}</span>}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {r.sale_status && <DcPill tone="muted">{r.sale_status}</DcPill>}
            {r.wants_to_sell && <DcPill tone="gold">Wants to sell</DcPill>}
            {r.wants_to_list && <DcPill tone="gold">Wants to list</DcPill>}
            {r.listed_with_us && <DcPill tone="good">Listed with us</DcPill>}
          </div>
          {r.last_comment && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 8, fontStyle: "italic" }}>“{r.last_comment}”</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", minWidth: 190 }}>
          {!rv ? (
            <button onClick={reveal} disabled={revealing} style={{ padding: "9px 14px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontWeight: 700, fontFamily: UI, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <Eye size={15} /> {revealing ? "Revealing…" : "Reveal number"}
            </button>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={telHref(phone)} onClick={() => logDataCallReliable(r.id, "call_click", user.id)} style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, fontWeight: 700, fontFamily: UI, textDecoration: "none", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Phone size={15} /> Call</a>
                <a href={waHref(phone)} target="_blank" rel="noreferrer" onClick={() => logDataCallReliable(r.id, "whatsapp_click", user.id)} style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontWeight: 700, fontFamily: UI, textDecoration: "none", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><MessageCircle size={15} /> WA</a>
              </div>
              {phone && <div style={{ fontSize: 12.5, color: T.inkSoft, textAlign: "center" }}>{phone}</div>}
              {email && <a href={dcMailHref(email)} onClick={() => logDataCallReliable(r.id, "email_click", user.id)} style={{ fontSize: 12, color: T.gold, textAlign: "center", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Mail size={12} /> {email}</a>}
            </>
          )}
          <button onClick={() => setOpen(!open)} style={{ ...miniBtn(), justifyContent: "center" }}>{open ? "Close" : "Log outcome"}</button>
        </div>
      </div>
      {open && <DcDisposition r={r} user={user} onSaved={() => { setOpen(false); onChanged && onChanged(); }} />}
    </div>
  );
}

function DcWorklist({ user, scope }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [projF, setProjF] = useState("");
  const [statusF, setStatusF] = useState("");
  const canManage = user && (user.role === "master_admin" || user.role === "admin" || user.role === "sales_manager");
  const load = async () => {
    setRows(null);
    let data, error;
    if (scope === "all") {
      ({ data, error } = await supabase.from("data_calling_admin_view").select("*").order("project_name", { ascending: true }));
    } else {
      ({ data, error } = await supabase.from("data_calling_agent_view").select("*").order("project_name", { ascending: true }));
    }
    let list = error ? [] : (data || []);
    if (scope === "mine") list = list.filter((r) => r.assigned_to_me);
    else if (scope === "open") list = list.filter((r) => r.is_open_calling);
    setRows(list);
  };
  useEffect(() => { load(); }, [scope]);
  const all = rows || [];
  const projects = [...new Set(all.map((r) => r.project_name).filter(Boolean))].sort();
  const ql = q.trim().toLowerCase();
  const filtered = all.filter((r) =>
    (!projF || r.project_name === projF) &&
    (!statusF || r.status === statusF) &&
    (!ql || ((r.owner_name || "") + " " + (r.unit_number || "") + " " + (r.project_name || "") + " " + (r.project_location || "")).toLowerCase().includes(ql)));
  const groups = {};
  filtered.forEach((r) => { const k = r.project_name || "Other"; (groups[k] = groups[k] || []).push(r); });
  const groupKeys = Object.keys(groups).sort();
  const emptyMsg = scope === "mine" ? "No records assigned to you yet" : scope === "open" ? "No projects are open for calling right now" : "No data uploaded yet";
  const emptySub = scope === "mine" ? "Your manager will assign you owners to call." : scope === "open" ? "When an admin marks a project as Open Calling, its owners appear here for everyone." : "Upload owner data from the Upload tab.";
  return (
    <div>
      <div style={{ ...card, padding: 14, marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} color={T.faint} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search owner, unit, project…" style={{ ...pInp, paddingLeft: 33 }} />
        </div>
        <select value={projF} onChange={(e) => setProjF(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 180px" }}>
          <option value="">All projects</option>{projects.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 150px" }}>
          <option value="">Any status</option>
          {Object.entries(DC_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={load} style={miniBtn()}><RefreshCw size={14} /> Refresh</button>
        <span style={{ fontSize: 12.5, color: T.muted, marginLeft: "auto" }}>{filtered.length} record{filtered.length === 1 ? "" : "s"}</span>
      </div>
      {rows == null && <div style={{ ...card, padding: 30, textAlign: "center", color: T.muted }}>Loading…</div>}
      {rows && filtered.length === 0 && (
        <div style={{ ...card, padding: 36, textAlign: "center", color: T.muted }}>
          <Phone size={26} color={T.faint} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600, color: T.ink }}>{emptyMsg}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{emptySub}</div>
        </div>
      )}
      {rows && groupKeys.map((gk) => (
        <div key={gk} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 2px 10px", flexWrap: "wrap" }}>
            <Building2 size={15} color={T.gold} />
            <span style={{ fontWeight: 800, color: T.ink, fontSize: 14 }}>{gk}</span>
            {groups[gk][0] && groups[gk][0].project_location && <span style={{ fontSize: 12, color: T.muted, display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={12} /> {groups[gk][0].project_location}</span>}
            {groups[gk][0] && groups[gk][0].is_open_calling && <DcPill tone="gold"><Unlock size={10} style={{ marginRight: 3 }} />Open Calling</DcPill>}
            <span style={{ fontSize: 12, color: T.muted }}>· {groups[gk].length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groups[gk].map((r) => <DcCard key={r.id} r={r} user={user} canManage={canManage} onChanged={load} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DcUpload({ user }) {
  const [rows, setRows] = useState(null);
  const [cols, setCols] = useState(null);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const FIELD_RULES = [
    ["owner_email",      (h) => /email|mail/.test(h)],
    ["owner_phone",      (h) => /phone|mobile|whatsapp|contact|telephone|^tel$/.test(h)],
    ["project_name",     (h) => /project|building|tower|develop/.test(h)],
    ["unit_number",      (h) => /unit|plot|apartment|villa|flat|^code$|unitcode/.test(h)],
    ["project_location", (h) => /location|area|community|city|address|emirate|district|island/.test(h)],
    ["owner_name",       (h) => /name|client|owner|customer/.test(h)],
  ];
  const fieldForHeader = (raw) => {
    const h = String(raw == null ? "" : raw).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!h) return null;
    for (const [f, t] of FIELD_RULES) if (t(h)) return f;
    return null;
  };
  const scoreHeader = (cells) => {
    const map = {}; let n = 0;
    (cells || []).forEach((c, i) => { const f = fieldForHeader(c); if (f && !(f in map)) { map[f] = i; n++; } });
    return { map, n, ok: ("project_name" in map) && ("owner_name" in map) };
  };
  const toCrmPhone = (raw) => { const d = normIntl(raw); return d ? "+" + d : ""; };
  const rowsFromAOA = (aoa) => {
    if (!aoa || !aoa.length) return [];
    let best = { n: -1 }, idx = -1;
    for (let i = 0; i < Math.min(20, aoa.length); i++) { const sc = scoreHeader(aoa[i]); if (sc.ok && sc.n > best.n) { best = sc; idx = i; } }
    if (idx < 0) return [];
    const out = [];
    for (let r = idx + 1; r < aoa.length; r++) {
      const row = aoa[r] || []; const o = { project_name: "", project_location: "", unit_number: "", owner_name: "", owner_phone: "", owner_email: "" };
      for (const f in best.map) { const v = row[best.map[f]]; o[f] = v == null ? "" : String(v).trim(); }
      o.owner_phone = toCrmPhone(o.owner_phone);
      o.owner_email = o.owner_email ? o.owner_email.toLowerCase() : "";
      if (o.project_name && o.owner_name && fieldForHeader(o.owner_name) !== "owner_name") out.push(o);
    }
    return out;
  };
  const csvToAOA = (text) => {
    const split = (l) => { const out = []; let cur = "", inq = false;
      for (let i = 0; i < l.length; i++) { const ch = l[i];
        if (ch === '"') inq = !inq; else if (ch === "," && !inq) { out.push(cur); cur = ""; } else cur += ch; }
      out.push(cur); return out.map((x) => x.trim().replace(/^"|"$/g, "")); };
    return text.split(/\r?\n/).filter((l) => l.trim()).map(split);
  };

  const onFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setErr(""); setRows(null); setCols(null); setResult(null); setFileName(file.name);
    const name = file.name.toLowerCase();
    try {
      let all = [];
      if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xlsm")) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        for (const sn of wb.SheetNames) {
          const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false, defval: "" });
          all = all.concat(rowsFromAOA(aoa));
        }
      } else if (name.endsWith(".csv") || name.endsWith(".txt")) {
        all = rowsFromAOA(csvToAOA(await file.text()));
      } else { setErr("Unsupported file. Upload a .xlsx or .csv file."); return; }
      if (!all.length) { setErr("Couldn't find owner rows. The sheet needs a header row with at least a Project and a Client/Owner name column (it can have title rows above it)."); return; }
      const present = {}; ["project_name", "project_location", "unit_number", "owner_name", "owner_phone", "owner_email"].forEach((f) => { present[f] = all.some((r) => r[f]); });
      setRows(all); setCols(present);
    } catch (x) { setErr("Couldn't read that file. Use a .xlsx or .csv export with a header row."); }
  };

  const run = async () => {
    if (!rows || !rows.length) return;
    setBusy(true); setErr(""); setResult(null); setProgress(0);
    let received = 0, inserted = 0, dupFile = 0, dupDb = 0, invalid = 0, errors = [];
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const batch = rows.slice(i, i + CHUNK);
      const { data, error } = await supabase.rpc("upload_data_calling", { p_rows: batch, p_source_file: fileName || null });
      if (error || (data && data.error)) {
        setBusy(false);
        setErr(((data && data.error) === "admin only" || /admin only/i.test((error && error.message) || "")) ? "Only admins can upload data." : "Upload failed after " + inserted + " added — please try again.");
        return;
      }
      const r = Array.isArray(data) ? data[0] : data;
      received += (r && r.received) || batch.length;
      inserted += (r && r.inserted) || 0;
      dupFile  += (r && r.duplicate_in_file) || 0;
      dupDb    += (r && r.duplicate_in_db) || 0;
      invalid  += (r && r.skipped_invalid) || 0;
      if (r && Array.isArray(r.errors)) errors = errors.concat(r.errors.map((x) => ({ ...x, row: (x.row || 0) + i })));
      setProgress(Math.min(i + CHUNK, rows.length));
    }
    setBusy(false);
    setResult({ received, inserted, dupFile, dupDb, invalid, errors });
  };

  const downloadTemplate = () => {
    const csv = "Location,Project Name,Unit Code,Client Name,Booking: Account Email,Booking: Account Phone\nDubai Islands,Bay Villas,DIB-P1-TH-0001,Owner Full Name,owner@example.com,9715XXXXXXXX\n";
    try {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url; a.download = "data_calling_template.csv"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {}
  };

  const FIELD_LABELS = { project_name: "Project", project_location: "Location", unit_number: "Unit", owner_name: "Owner name", owner_phone: "Phone", owner_email: "Email" };
  const errShown = result ? result.errors.slice(0, 200) : [];

  return (
    <div>
      <div style={{ ...card, padding: 16, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: T.ink, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><Upload size={16} color={T.gold} /> Upload owner data</div>
        <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6, marginBottom: 12 }}>
          Upload an <b>Excel (.xlsx)</b> or <b>.csv</b> file. Columns are detected automatically by name (Project / Building, Location / Area, Unit / Code, Client / Owner name, Phone / Mobile, Email), the header row is found even if there are title rows above it, and all sheets are scanned. Phone numbers are auto-formatted to the CRM standard (+country code). Every valid row is imported; duplicates (same project + unit + phone, or project + owner + phone) and rows missing a project or owner are reported back with counts.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input type="file" accept=".xlsx,.xls,.xlsm,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onChange={onFile} style={{ fontSize: 13 }} />
          <button onClick={downloadTemplate} style={miniBtn()}><Download size={14} /> Template</button>
        </div>
      </div>

      {err && <div style={{ ...card, padding: 12, marginBottom: 12, color: T.bad, fontSize: 12.5, fontWeight: 600 }}>{err}</div>}

      {rows && !result && (
        <div style={{ ...card, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Detected <b>{rows.length}</b> row{rows.length === 1 ? "" : "s"}{fileName ? " in " + fileName : ""}.</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {Object.keys(FIELD_LABELS).map((f) => (
              <span key={f} style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, border: `1px solid ${cols && cols[f] ? T.goldEdge : T.hair}`, background: cols && cols[f] ? T.goldTint : T.paper, color: cols && cols[f] ? T.gold : T.faint }}>
                {cols && cols[f] ? "✓ " : "– "}{FIELD_LABELS[f]}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12 }}>First: <b>{rows[0].owner_name}</b> · {rows[0].project_name}{rows[0].unit_number ? " · " + rows[0].unit_number : ""}{rows[0].owner_phone ? " · " + rows[0].owner_phone : ""}</div>
          <button onClick={run} disabled={busy} style={{ ...dcPrimaryBtn, opacity: busy ? .6 : 1, display: "inline-flex", alignItems: "center", gap: 7 }}>{busy ? ("Uploading… " + progress + "/" + rows.length) : <><Upload size={15} /> Upload {rows.length} records</>}</button>
        </div>
      )}

      {result && (
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontWeight: 700, color: T.ink, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={16} color={T.ok} /> Upload complete</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <DcStat n={result.inserted} label="Imported" tone="ok" />
            <DcStat n={result.dupFile + result.dupDb} label="Duplicates" tone="warn" />
            <DcStat n={result.invalid} label="Skipped" tone={result.invalid ? "bad" : "muted"} />
            <DcStat n={result.received} label="Processed" tone="muted" />
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: errShown.length ? 12 : 0 }}>
            {result.dupFile} duplicate{result.dupFile === 1 ? "" : "s"} within the file · {result.dupDb} already in the system{fileName ? " · from " + fileName : ""}.
          </div>
          {errShown.length > 0 && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.bad, marginBottom: 6 }}>{result.errors.length} row{result.errors.length === 1 ? "" : "s"} skipped — fix and re-upload:</div>
              <div style={{ maxHeight: 220, overflowY: "auto", border: `1px solid ${T.hair}`, borderRadius: 8 }}>
                {errShown.map((e, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, padding: "6px 10px", borderBottom: idx < errShown.length - 1 ? `1px solid ${T.hairSoft}` : "none", fontSize: 12 }}>
                    <span style={{ color: T.faint, minWidth: 52 }}>Row {e.row}</span>
                    <span style={{ color: T.bad, minWidth: 150 }}>{e.reason}</span>
                    <span style={{ color: T.muted }}>{[e.project, e.owner].filter(Boolean).join(" · ") || "—"}</span>
                  </div>
                ))}
              </div>
              {result.errors.length > errShown.length && <div style={{ fontSize: 11.5, color: T.faint, marginTop: 6 }}>Showing first {errShown.length} of {result.errors.length}.</div>}
            </div>
          )}
          <button onClick={() => { setRows(null); setResult(null); setCols(null); setFileName(""); setErr(""); }} style={{ ...miniBtn(), marginTop: 14 }}>Upload another file</button>
        </div>
      )}
    </div>
  );
}

function DcTeam({ user }) {
  const isAdmin = user && (user.role === "master_admin" || user.role === "admin");
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState(null);
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [recs, setRecs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [fProj, setFProj] = useState("");
  const [fLoc, setFLoc] = useState("");
  const [fAssign, setFAssign] = useState("all");
  const [sel, setSel] = useState({});
  const [oneAgent, setOneAgent] = useState("");
  const [multi, setMulti] = useState({});
  const [pProj, setPProj] = useState(""); const [pAgent, setPAgent] = useState(""); const [pIncl, setPIncl] = useState(false);

  const loadStats = async () => {
    setStats(null);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    try { const { data } = await supabase.rpc("data_calling_manager_stats", { p_since: since }); setStats(data || []); } catch (e) { setStats([]); }
  };
  const loadCore = async () => {
    try { const { data } = await supabase.rpc("data_calling_project_overview"); setOverview(data || []); } catch (e) { setOverview([]); }
    try { const { data } = await supabase.rpc("user_directory"); setAgents(data || []); } catch (e) {}
    if (isAdmin) {
      const { data, error } = await supabase.from("data_calling_admin_view")
        .select("id,project_name,project_location,owner_name,unit_number,status,assigned_agent_id,assigned_agent_name,is_open_calling")
        .order("project_name", { ascending: true });
      setRecs(error ? [] : (data || []));
    }
  };
  useEffect(() => { loadCore(); }, []);
  useEffect(() => { loadStats(); }, [days]);
  const refreshAll = () => { loadCore(); loadStats(); setSel({}); };

  const toggleOpen = async (project, next) => {
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("data_calling_set_open_calling", { p_project: project, p_open: next });
    setBusy(false);
    if (error || (data && data.error)) { setMsg("Couldn't change Open Calling — admins only."); return; }
    loadCore();
  };

  const selIds = Object.keys(sel).filter((k) => sel[k]);
  const multiIds = Object.keys(multi).filter((k) => multi[k]);

  const assignOne = async () => {
    if (!oneAgent || selIds.length === 0) { setMsg("Select records and an agent."); return; }
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("data_calling_assign_records", { p_ids: selIds, p_agent: oneAgent });
    setBusy(false);
    if (error || (data && data.error)) { setMsg("Couldn't assign — admins only."); return; }
    setMsg("Assigned " + ((data && data.assigned) || selIds.length) + " record(s)."); setSel({}); refreshAll();
  };
  const assignBulk = async () => {
    if (multiIds.length === 0 || selIds.length === 0) { setMsg("Select records and at least one agent to split across."); return; }
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("data_calling_bulk_assign", { p_ids: selIds, p_agents: multiIds });
    setBusy(false);
    if (error || (data && data.error)) { setMsg("Couldn't assign — admins only."); return; }
    setMsg("Split " + ((data && data.assigned) || selIds.length) + " record(s) across " + multiIds.length + " agent(s)."); setSel({}); refreshAll();
  };
  const unassignSel = async () => {
    if (selIds.length === 0) { setMsg("Select records to unassign."); return; }
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("data_calling_unassign", { p_ids: selIds });
    setBusy(false);
    if (error || (data && data.error)) { setMsg("Couldn't unassign — admins only."); return; }
    setMsg("Unassigned " + ((data && data.unassigned) || 0) + " record(s)."); setSel({}); refreshAll();
  };
  const assignProject = async () => {
    if (!pProj || !pAgent) { setMsg("Pick a project and an agent."); return; }
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("data_calling_assign_project", { p_project: pProj, p_agent: pAgent, p_include_assigned: pIncl });
    setBusy(false);
    if (error || (data && data.error)) { setMsg("Couldn't assign project — admins only."); return; }
    setMsg("Assigned " + ((data && data.assigned) || 0) + " record(s) in " + pProj + "."); refreshAll();
  };

  const allRecs = recs || [];
  const recProjects = [...new Set(allRecs.map((r) => r.project_name).filter(Boolean))].sort();
  const locations = [...new Set(allRecs.map((r) => r.project_location).filter(Boolean))].sort();
  const wbList = allRecs.filter((r) =>
    (!fProj || r.project_name === fProj) &&
    (!fLoc || r.project_location === fLoc) &&
    (fAssign === "all" || (fAssign === "assigned" ? r.assigned_agent_id : !r.assigned_agent_id)));
  const wbShown = wbList.slice(0, 500);
  const allSelected = wbShown.length > 0 && wbShown.every((r) => sel[r.id]);
  const toggleAll = () => {
    const n = { ...sel };
    if (allSelected) wbShown.forEach((r) => delete n[r.id]);
    else wbShown.forEach((r) => { n[r.id] = true; });
    setSel(n);
  };

  const th = { textAlign: "left", padding: "9px 10px", fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", borderBottom: `1px solid ${T.hair}` };
  const td = { padding: "9px 10px", fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.hairSoft}` };

  return (
    <div>
      <div style={{ ...card, padding: 14, marginBottom: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: T.muted }}>Period</span>
        {[[7, "7 days"], [30, "30 days"], [90, "90 days"]].map(([d, l]) => (
          <button key={d} onClick={() => setDays(d)} style={{ ...miniBtn(), background: days === d ? T.goldTint : T.paper, borderColor: days === d ? T.gold : T.hair }}>{l}</button>
        ))}
        <button onClick={refreshAll} style={{ ...miniBtn(), marginLeft: "auto" }}><RefreshCw size={14} /> Refresh</button>
      </div>

      {msg && <div style={{ ...card, padding: 10, marginBottom: 12, fontSize: 12.5, color: T.ink }}>{msg}</div>}

      <div style={{ ...card, padding: 16, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: T.ink, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><Building2 size={16} color={T.gold} /> Coverage by project</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead><tr>
              <th style={th}>Project</th><th style={th}>Total</th><th style={th}>Assigned</th><th style={th}>Unassigned</th>
              <th style={th}>Contacted</th><th style={th}>Pending</th><th style={th}>Open Calling</th>
            </tr></thead>
            <tbody>
              {overview == null && <tr><td style={td} colSpan={7}>Loading…</td></tr>}
              {overview && overview.length === 0 && <tr><td style={{ ...td, color: T.muted }} colSpan={7}>No data uploaded yet.</td></tr>}
              {overview && overview.map((p) => (
                <tr key={p.project_name}>
                  <td style={{ ...td, fontWeight: 600 }}>{p.project_name}</td>
                  <td style={td}>{p.total}</td>
                  <td style={td}>{p.assigned}</td>
                  <td style={{ ...td, fontWeight: 700, color: p.unassigned > 0 ? T.gold : T.muted }}>{p.unassigned}</td>
                  <td style={td}>{p.contacted}</td>
                  <td style={td}>{p.pending}</td>
                  <td style={td}>
                    {isAdmin ? (
                      <button onClick={() => toggleOpen(p.project_name, !p.open_calling)} disabled={busy} title={p.open_calling ? "Open to all agents — click to make private" : "Private — click to open to all agents"}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontFamily: UI, fontWeight: 700, fontSize: 11.5,
                          border: `1px solid ${p.open_calling ? T.gold : T.hair}`, background: p.open_calling ? T.goldTint : T.paper, color: p.open_calling ? T.gold : T.muted }}>
                        {p.open_calling ? <Unlock size={12} /> : <Lock size={12} />}{p.open_calling ? "On" : "Off"}
                      </button>
                    ) : (p.open_calling ? <DcPill tone="gold">On</DcPill> : <span style={{ color: T.faint, fontSize: 12 }}>Off</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div style={{ ...card, padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: T.ink, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><Users size={16} color={T.gold} /> Assign records</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", paddingBottom: 12, marginBottom: 12, borderBottom: `1px dashed ${T.hair}` }}>
            <span style={{ fontSize: 12.5, color: T.muted, fontWeight: 700 }}>Whole project</span>
            <select value={pProj} onChange={(e) => setPProj(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 200px" }}>
              <option value="">Choose project…</option>
              {(overview || []).map((p) => <option key={p.project_name} value={p.project_name}>{p.project_name} ({p.unassigned} free)</option>)}
            </select>
            <span style={{ fontSize: 12.5, color: T.muted }}>→</span>
            <select value={pAgent} onChange={(e) => setPAgent(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 180px" }}>
              <option value="">Choose agent…</option>{agents.map((g) => <option key={g.id} value={g.id}>{g.full_name || g.email}</option>)}
            </select>
            <label style={{ fontSize: 12, color: T.muted, display: "inline-flex", alignItems: "center", gap: 5 }}><input type="checkbox" checked={pIncl} onChange={(e) => setPIncl(e.target.checked)} /> reassign already-assigned</label>
            <button onClick={assignProject} disabled={busy} style={{ ...dcPrimaryBtn, opacity: busy ? .6 : 1 }}>Assign project</button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            <select value={fProj} onChange={(e) => setFProj(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 180px" }}>
              <option value="">All projects</option>{recProjects.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={fLoc} onChange={(e) => setFLoc(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 160px" }}>
              <option value="">All locations</option>{locations.map((l) => <option key={l}>{l}</option>)}
            </select>
            <select value={fAssign} onChange={(e) => setFAssign(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 150px" }}>
              <option value="all">All</option><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option>
            </select>
            <span style={{ fontSize: 12, color: T.muted, marginLeft: "auto" }}>{selIds.length} selected · {wbList.length} shown</span>
          </div>

          <div style={{ border: `1px solid ${T.hair}`, borderRadius: 8, maxHeight: 300, overflowY: "auto", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderBottom: `1px solid ${T.hair}`, position: "sticky", top: 0, background: T.paper }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 700 }}>Select all shown</span>
            </div>
            {recs == null && <div style={{ padding: 14, color: T.muted, fontSize: 12.5 }}>Loading…</div>}
            {recs && wbShown.length === 0 && <div style={{ padding: 14, color: T.muted, fontSize: 12.5 }}>No records match these filters.</div>}
            {wbShown.map((r) => (
              <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderBottom: `1px solid ${T.hairSoft}`, cursor: "pointer", fontSize: 12.5 }}>
                <input type="checkbox" checked={!!sel[r.id]} onChange={(e) => setSel((s) => ({ ...s, [r.id]: e.target.checked }))} />
                <span style={{ fontWeight: 600, color: T.ink, minWidth: 120 }}>{r.owner_name}</span>
                <span style={{ color: T.muted, minWidth: 110 }}>{r.project_name}{r.unit_number ? " · " + r.unit_number : ""}</span>
                <span style={{ color: T.faint, marginLeft: "auto" }}>{r.assigned_agent_name ? "→ " + r.assigned_agent_name : "unassigned"}</span>
              </label>
            ))}
            {wbList.length > wbShown.length && <div style={{ padding: "8px 10px", fontSize: 11.5, color: T.faint }}>Showing first {wbShown.length} — narrow the filters to see the rest.</div>}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <select value={oneAgent} onChange={(e) => setOneAgent(e.target.value)} style={{ ...pInp, width: "auto", flex: "0 1 190px" }}>
              <option value="">Assign selected to…</option>{agents.map((g) => <option key={g.id} value={g.id}>{g.full_name || g.email}</option>)}
            </select>
            <button onClick={assignOne} disabled={busy} style={{ ...dcPrimaryBtn, opacity: busy ? .6 : 1 }}>Assign selected</button>
            <button onClick={unassignSel} disabled={busy} style={{ ...miniBtn(), color: T.bad }}>Unassign selected</button>
          </div>

          <div>
            <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 700, marginBottom: 6 }}>Or split the selected records evenly across several agents</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {agents.map((g) => {
                const on = !!multi[g.id];
                return <button key={g.id} onClick={() => setMulti((m) => ({ ...m, [g.id]: !on }))} style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontFamily: UI, border: `1px solid ${on ? T.gold : T.hair}`, background: on ? T.goldTint : T.paper, color: on ? T.gold : T.muted }}>{g.full_name || g.email}</button>;
              })}
            </div>
            <button onClick={assignBulk} disabled={busy} style={{ ...dcPrimaryBtn, opacity: busy ? .6 : 1 }}>Split across {multiIds.length || 0} agent{multiIds.length === 1 ? "" : "s"}</button>
          </div>
        </div>
      )}

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ fontWeight: 700, color: T.ink, padding: "14px 16px 0", display: "flex", alignItems: "center", gap: 8 }}><BarChart3 size={16} color={T.gold} /> Team performance</div>
        <div style={{ overflowX: "auto", padding: "10px 4px 4px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead><tr>
              <th style={th}>Agent</th><th style={th}>Assigned</th><th style={th}>Calls</th><th style={th}>WhatsApp</th>
              <th style={th}>Updates</th><th style={th}>Reached</th><th style={th}>Reach %</th><th style={th}>Conversions</th>
            </tr></thead>
            <tbody>
              {stats == null && <tr><td style={td} colSpan={8}>Loading…</td></tr>}
              {stats && stats.length === 0 && <tr><td style={{ ...td, color: T.muted }} colSpan={8}>No call activity in this period.</td></tr>}
              {stats && stats.map((a) => {
                const reach = a.dispositions > 0 ? Math.round((a.reached / a.dispositions) * 100) : 0;
                return (<tr key={a.agent_id}>
                  <td style={{ ...td, fontWeight: 600 }}>{a.agent_name || "—"}</td>
                  <td style={td}>{a.assigned}</td><td style={td}>{a.calls}</td><td style={td}>{a.whatsapp}</td>
                  <td style={td}>{a.dispositions}</td><td style={td}>{a.reached}</td><td style={td}>{reach}%</td>
                  <td style={{ ...td, fontWeight: 700, color: a.conversions > 0 ? T.ok : T.ink }}>{a.conversions}</td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DataCalling({ user }) {
  const role = user && user.role;
  const isAdmin = role === "master_admin" || role === "admin";
  const canManage = isAdmin || role === "sales_manager";
  const TABS = [];
  if (canManage) TABS.push(["all", "All Data"]);
  TABS.push(["mine", "Assigned to Me"]);
  TABS.push(["open", "Open Calling"]);
  if (isAdmin) TABS.push(["upload", "Upload Data"]);
  if (canManage) TABS.push(["team", "Team / Assignment"]);
  const [tab, setTab] = useState(canManage ? "all" : "mine");

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 23, fontWeight: 800, color: T.ink, display: "flex", alignItems: "center", gap: 10 }}><Phone size={22} color={T.gold} /> Data Calling</div>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Call property owners in your projects and record who wants to sell or list with Amber. Every reveal, call and WhatsApp is logged automatically. Kept separate from Leads.</div>
      </div>

      {TABS.length > 1 && (
        <div style={{ display: "flex", gap: 6, background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 10, padding: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {TABS.map(([k, lbl]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...miniBtn(), border: "none", background: tab === k ? T.goldTint : "transparent", color: tab === k ? T.gold : T.ink }}>{lbl}</button>
          ))}
        </div>
      )}

      {tab === "team" && canManage ? <DcTeam user={user} />
        : tab === "upload" && isAdmin ? <DcUpload user={user} />
        : tab === "all" && canManage ? <DcWorklist user={user} scope="all" />
        : tab === "open" ? <DcWorklist user={user} scope="open" />
        : <DcWorklist user={user} scope="mine" />}
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
  const [frame, setFrame] = useState("all");

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
  const shown = sortFeaturedNewest(filtered.filter((p) => withinFrame(p.created_at, frame)));

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 600 }}>{shown.length} {shown.length === 1 ? "project" : "projects"}{frame === "week" ? " · this week" : frame === "month" ? " · this month" : ""} · newest first</div>
        <FrameTabs value={frame} onChange={setFrame} />
      </div>

      {projects === null ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading projects…</div>
        : shown.length === 0 ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>No projects {all.length === 0 ? "yet. " + (isAdmin ? "Add one above, after running migration 08 in Supabase." : "have been added yet.") : filtered.length === 0 ? "match your filters." : (frame === "week" ? "added this week. Switch to This Month or All." : frame === "month" ? "added this month. Switch to All." : "to show.")}</div>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {shown.map((p) => {
            const due = p.review_date && p.review_date <= today;
            const visFiles = (p.files || []).filter((fl) => isAdmin || !fl.internal_only);
            const open = expand[p.id];
            const badge = p.status === "upcoming" ? "Upcoming" : p.status === "sold_out" ? "Sold out" : isRecent(p.created_at, 7) ? "New" : null;
            const foot = [p.developer ? "By " + p.developer : null, p.handover_date ? "Handover " + p.handover_date : null].filter(Boolean).join("  ·  ");
            return (
              <HotCard key={p.id} img={null} badge={badge} name={p.name} desc={p.selling_points}
                price={p.starting_price} paymentPlan={p.payment_plan} beds={p.bedroom_options} ptype={p.property_type}
                location={p.area} footNote={foot || null} dim={p.status === "inactive"}>
                {open && <div style={{ marginTop: 2, fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55, borderTop: `1px solid ${T.hairSoft}`, paddingTop: 10 }}>
                  {p.investment_points && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Investment:</b> {p.investment_points}</div>}
                  {p.golden_visa && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Golden Visa:</b> {p.golden_visa}</div>}
                  {p.target_client && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Target client:</b> {p.target_client}</div>}
                  {p.risks_notes && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Risks/notes:</b> {p.risks_notes}</div>}
                  {p.talking_points && <div style={{ marginBottom: 6 }}><b style={{ color: T.ink }}>Talking points:</b> {p.talking_points}</div>}
                </div>}
                {(p.investment_points || p.golden_visa || p.target_client || p.risks_notes || p.talking_points || (p.selling_points && p.selling_points.length > 90)) &&
                  <button onClick={() => setExpand((s) => ({ ...s, [p.id]: !s[p.id] }))} style={{ alignSelf: "flex-start", marginTop: 8, background: "none", border: "none", color: T.gold, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, padding: 0 }}>{open ? "Show less" : "More details"}</button>}

                {visFiles.length > 0 && <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                  {visFiles.map((fl) => <button key={fl.id} onClick={() => download(p, fl)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 8, border: `1px solid ${T.hair}`, background: T.bone, color: T.ink, cursor: "pointer", fontSize: 11.5, fontWeight: 600, fontFamily: UI }}>
                    <Download size={13} color={T.gold} /> {fileKindLabel(fl.kind)}{fl.internal_only ? " (int.)" : ""}</button>)}
                </div>}

                {(due || isAdmin) && <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {due && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: T.warnSoft, color: T.warn, display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> Review due</span>}
                  {isAdmin && <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                    <button onClick={() => setEditing(p)} title="Edit" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: T.inkSoft, cursor: "pointer", display: "grid", placeItems: "center" }}><Pencil size={14} /></button>
                    <button onClick={() => toggleStatus(p)} title={p.status === "inactive" ? "Activate" : "Deactivate"} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: p.status === "inactive" ? T.ok : T.warn, cursor: "pointer", display: "grid", placeItems: "center" }}>{p.status === "inactive" ? <Check size={14} /> : <EyeOff size={14} />}</button>
                    <button onClick={() => softDelete(p)} title="Delete" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.hair}`, background: T.paper, color: T.bad, cursor: "pointer", display: "grid", placeItems: "center" }}><Trash2 size={14} /></button>
                  </div>}
                </div>}
              </HotCard>
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
  const rowToForm = (e) => ({ deal_type: e.deal_type || "Sales", transaction_side: e.transaction_side || "", area: e.area || "", project: e.project || "", developer: e.developer || "", property_type: e.property_type || "", unit_no: e.unit_no || "", bedrooms: e.bedrooms || "", property_value: e.property_value || "", ready_offplan: e.ready_offplan || "", commission_pct: e.commission_pct || "2", vat_applies: !!e.vat_amount, external_split: e.external_split || "", referral_fee: e.referral_fee || "", other_deductions: e.other_deductions || "", sole_agent: e.sole_agent !== false, participants: e.participants || [] });
  useEffect(() => { let alive = true; (async () => {
    if (existing || dealId) return;
    if (!lead || !lead.id || !user || !user.id) return;
    let res = await supabase.from("deals").select("*").eq("lead_id", lead.id).eq("agent_id", user.id).eq("status", "draft").eq("deleted", false).eq("archived", false).order("updated_at", { ascending: false }).limit(1);
    if (res.error) res = await supabase.from("deals").select("*").eq("lead_id", lead.id).eq("agent_id", user.id).eq("status", "draft").eq("deleted", false).order("updated_at", { ascending: false }).limit(1);
    const d = res && res.data && res.data[0];
    if (alive && d) { setDealId(d.id); setF(rowToForm(d)); }
  })(); return () => { alive = false; }; }, []);

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
    let pre = await supabase.from("deals").select("id").eq("lead_id", lead.id).eq("agent_id", user.id).eq("status", "draft").eq("deleted", false).eq("archived", false).order("updated_at", { ascending: false }).limit(1);
    if (pre.error) pre = await supabase.from("deals").select("id").eq("lead_id", lead.id).eq("agent_id", user.id).eq("status", "draft").eq("deleted", false).order("updated_at", { ascending: false }).limit(1);
    if (pre.data && pre.data[0]) { const eid = pre.data[0].id; setDealId(eid); await supabase.from("deals").update(buildRow("draft")).eq("id", eid); return eid; }
    const { data, error } = await supabase.from("deals").insert(buildRow("draft")).select("id").single();
    if (error) {
      let again = await supabase.from("deals").select("id").eq("lead_id", lead.id).eq("agent_id", user.id).eq("status", "draft").eq("deleted", false).order("updated_at", { ascending: false }).limit(1);
      if (again.data && again.data[0]) { const aid = again.data[0].id; setDealId(aid); await supabase.from("deals").update(buildRow("draft")).eq("id", aid); return aid; }
      throw error;
    }
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
      if (lead && lead.id) {
        const nowIso = new Date().toISOString();
        try { await supabase.from("leads").update({ status: "Closed Won Pending Approval" }).eq("id", lead.id); } catch (e) {}
        try { await supabase.from("leads").update({ is_open: false, closed_locked: true, closed_by: user.id, closed_at: nowIso, closed_deal_id: id }).eq("id", lead.id); } catch (e) {}
        const agentName = (user && (user.name || user.full_name)) || "Agent";
        const whenStr = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        try { await supabase.from("lead_comments").insert({ lead_id: lead.id, author_id: user.id, body: "Deal closed by " + agentName + " on " + whenStr + "." }); } catch (e) {}
        try { await supabase.from("lead_activity").insert({ lead_id: lead.id, actor_id: user.id, action: "deal_closed", detail: { by: agentName, at: nowIso } }); } catch (e) {}
      }
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
            {<button onClick={async () => { setBusy(true); try { await ensureDraft(); onDone && onDone(); } catch (e) { setErr("Could not save draft."); } finally { setBusy(false); } }} style={{ padding: "10px 14px", borderRadius: 9, border: `1px solid ${T.hair}`, background: T.paper, color: T.muted, cursor: "pointer", fontWeight: 600, fontFamily: UI, fontSize: 12.5 }}>Save Draft</button>}
          </div>
          {step < 5 ? <button onClick={() => goStep(step + 1)} disabled={busy} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, cursor: "pointer", fontWeight: 700, fontFamily: UI, opacity: busy ? .6 : 1 }}>{busy ? "…" : "Next"}</button>
            : <button onClick={submit} disabled={busy} style={{ padding: "10px 22px", borderRadius: 9, border: "none", background: T.btnBg, color: T.btnFg, cursor: "pointer", fontWeight: 700, fontFamily: UI, display: "flex", alignItems: "center", gap: 7, opacity: busy ? .6 : 1 }}><Check size={15} /> {busy ? "Submitting…" : "Submit for Approval"}</button>}
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
  const [dir, setDir] = useState([]);
  const dirName = (id) => { const a = dir.find((x) => x.id === id); return a ? a.full_name : null; };

  const load = async () => {
    const { data: d, error } = await supabase.from("deals").select("*").eq("id", dealId).single();
    if (error || !d) { setErr("load"); return; }
    setDeal(d); setNote(d.admin_notes || "");
    const [{ data: dd }, { data: aa }] = await Promise.all([
      supabase.from("deal_documents").select("*").eq("deal_id", dealId).order("created_at"),
      supabase.from("deal_activity").select("*, actor:profiles!deal_activity_actor_id_fkey(full_name, role)").eq("deal_id", dealId).order("created_at", { ascending: false }).limit(60),
    ]);
    setDocs(dd || []); setActs(aa || []);
    try { const { data: ag } = await supabase.rpc("user_directory"); setDir(ag || []); } catch (e) {}
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
      try { await supabase.from("leads").update({ closed_locked: true, closed_by: deal.agent_id, closed_at: new Date().toISOString(), closed_deal_id: deal.id }).eq("id", deal.lead_id); } catch (e) {}
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

  const delDeal = async () => {
    const reason = window.prompt("Are you sure you want to delete this deal? This action will be recorded. Enter a reason (required):", "");
    if (reason === null) return;
    if (!reason.trim()) { setErr("A reason is required to delete this deal."); return; }
    setBusy(true);
    const { error } = await supabase.rpc("delete_deal", { p_deal_id: deal.id, p_reason: reason });
    if (error) { setErr(error.message || "Could not delete this deal."); setBusy(false); return; }
    go("deals");
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

    {isAdmin && <div style={{ ...card, padding: 16, marginTop: 14, borderColor: T.badSoft }}>
      <SectionMini>Danger zone</SectionMini>
      <div style={{ fontSize: 12, color: T.muted, margin: "6px 0 10px" }}>Deleting soft-deletes this deal (kept for audit), removes it from lists and commission, and records who deleted it and why.</div>
      <button onClick={delDeal} disabled={busy} style={{ background: T.badSoft, color: T.bad, border: "1px solid " + T.bad, borderRadius: 9, padding: "10px 16px", fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Delete deal</button>
    </div>}

    <SectionTitle>Activity timeline</SectionTitle>
    <div style={{ ...card, padding: 16 }}>
      {acts.length === 0 ? <div style={{ color: T.muted, fontSize: 12.5 }}>No activity yet.</div> :
        acts.map((t, i) => <div key={t.id} style={{ display: "flex", gap: 11, paddingBottom: i === acts.length - 1 ? 0 : 14 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><div style={{ width: 9, height: 9, borderRadius: 9, background: T.gold, marginTop: 3 }} />{i !== acts.length - 1 && <div style={{ width: 2, flex: 1, background: T.hairSoft, marginTop: 3 }} />}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{String(t.action).replace(/_/g, " ")}{t.detail && t.detail.note ? ' — "' + t.detail.note + '"' : ""}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{t.actor?.full_name || dirName(t.actor_id) || "System"} · {when(t.created_at)}</div></div>
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

function DeletedDeals() {
  const [rows, setRows] = useState(null);
  const [dir, setDir] = useState([]);
  useEffect(() => { (async () => {
    const { data } = await supabase.from("deal_deletions").select("*").order("created_at", { ascending: false }).limit(500);
    setRows(data || []);
    try { const { data: ag } = await supabase.rpc("user_directory"); setDir(ag || []); } catch (e) {}
  })(); }, []);
  const nm = (id) => { const a = dir.find((x) => x.id === id); return a ? a.full_name : (id ? "Unknown" : "System"); };
  const whenF = (t) => new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  if (rows === null) return <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading deleted records…</div>;
  if (rows.length === 0) return <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>No deleted deals.</div>;
  return <div style={{ display: "grid", gap: 10 }}>
    <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 2 }}>Soft-deleted deals, retained for audit.</div>
    {rows.map((r) => <div key={r.id} style={{ ...card, padding: 14, borderColor: T.badSoft }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700 }}>Deal #{r.deal_no == null ? "—" : r.deal_no}</span>
        <Chip tone="bad">Deleted</Chip>
        <span style={{ fontSize: 11.5, color: T.muted }}>Previous status: {r.previous_status || "—"} · {r.delete_type || "—"}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: T.ink }}>Deleted by <b>{nm(r.deleted_by)}</b> ({roleLabel(r.deleted_by_role)}) · {whenF(r.created_at)}</div>
      {r.reason && <div style={{ marginTop: 6, background: T.badSoft, color: T.bad, borderRadius: 8, padding: "8px 11px", fontSize: 12 }}>Reason: {r.reason}</div>}
    </div>)}
  </div>;
}

function Deals({ user, go, openDeal, openLead }) {
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
  const isMaster = user && user.role === "master_admin";
  const delDeal = async (d, e) => {
    if (e) e.stopPropagation();
    let reason = null;
    if (isAdmin) {
      reason = window.prompt("Are you sure you want to delete this deal? This action will be recorded. Enter a reason (required):", "");
      if (reason === null) return;
      if (!reason.trim()) { window.alert("A reason is required to delete this deal."); return; }
    } else if (!window.confirm("Are you sure you want to delete this deal? This action will be recorded.")) { return; }
    const { error } = await supabase.rpc("delete_deal", { p_deal_id: d.id, p_reason: reason });
    if (error) { window.alert(error.message || "Could not delete this deal."); return; }
    load();
  };
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
        <Kpi label="Drafts" value={group("draft").length} />
        <Kpi label="Pending" value={group("pending").length} tone="warn" />
        <Kpi label="Approved" value={group("approved").length} tone="ok" />
        <Kpi label="Needs correction" value={group("needs_correction").length} tone={group("needs_correction").length ? "bad" : null} />
        <Kpi label="Rejected" value={group("rejected").length} />
      </div>
      {deals === null ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>Loading…</div>
        : mine.length === 0 ? <div style={{ ...card, padding: 40, textAlign: "center", color: T.muted }}>No deals yet. Open one of your leads and tap <b>Close deal</b> to submit one.</div>
        : <div style={{ display: "grid", gap: 10 }}>
          {mine.map((d) => { const sm = dealStatusMeta(d.status); return <div key={d.id} onClick={() => (d.status === "draft" && d.lead_id && openLead) ? openLead(d.lead_id) : openDeal(d.id)} style={{ ...card, padding: 14, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div><span style={{ fontWeight: 700 }}>{d.client_name}</span> <span style={{ color: T.gold, fontSize: 11, fontWeight: 700 }}>{dealNoFmt(d)}</span>
                <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{[d.deal_type, d.project, d.area].filter(Boolean).join(" · ")} · {when(d.created_at)}</div></div>
              <Chip tone={sm[2]}>{sm[1]}</Chip>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, flexWrap: "wrap" }}>
              <div><span style={{ color: T.faint }}>Value </span><b>{aed(d.property_value)}</b></div>
              <div><span style={{ color: T.faint }}>{d.status === "approved" ? "Approved comm. " : "Est. commission "}</span><b>{d.agent_commission == null ? "—" : aed(d.agent_commission)}</b></div>
            </div>
            {d.status === "draft" && <div style={{ marginTop: 10, fontSize: 11.5, color: T.gold, fontWeight: 700 }}>Draft — tap to edit & submit →</div>}
            {d.status === "needs_correction" && d.correction_note && <div style={{ marginTop: 10, background: T.warnSoft, color: T.warn, borderRadius: 8, padding: "8px 11px", fontSize: 12 }}>Correction needed: {d.correction_note}</div>}
            {d.status === "rejected" && d.correction_note && <div style={{ marginTop: 10, background: T.badSoft, color: T.bad, borderRadius: 8, padding: "8px 11px", fontSize: 12 }}>Reason: {d.correction_note}</div>}
            {d.status === "draft" && <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}><button onClick={(e) => delDeal(d, e)} style={{ ...miniBtn(), padding: "5px 10px", fontSize: 11, borderColor: T.bad, color: T.bad }}>Delete draft</button></div>}
          </div>; })}
        </div>}
    </div>;
  }

  // Admin view
  return <div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      <button onClick={() => setTab("approvals")} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${tab === "approvals" ? T.gold : T.hair}`, background: tab === "approvals" ? T.goldSoft : T.paper, color: tab === "approvals" ? T.gold : T.muted, fontWeight: 700, cursor: "pointer", fontFamily: UI, fontSize: 13 }}>Deal Approvals</button>
      <button onClick={() => setTab("commissions")} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${tab === "commissions" ? T.gold : T.hair}`, background: tab === "commissions" ? T.goldSoft : T.paper, color: tab === "commissions" ? T.gold : T.muted, fontWeight: 700, cursor: "pointer", fontFamily: UI, fontSize: 13 }}>Agent commissions</button>
      {isMaster && <button onClick={() => setTab("deleted")} style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid " + (tab === "deleted" ? T.gold : T.hair), background: tab === "deleted" ? T.goldSoft : T.paper, color: tab === "deleted" ? T.gold : T.muted, fontWeight: 700, cursor: "pointer", fontFamily: UI, fontSize: 13 }}>Deleted records</button>}
    </div>
    {tab === "deleted" ? <DeletedDeals /> : tab === "commissions" ? <CommissionSettings user={user} /> : <>
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
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}><button onClick={(e) => delDeal(d, e)} style={{ ...miniBtn(), padding: "5px 10px", fontSize: 11, borderColor: T.bad, color: T.bad }}>Delete</button></div>
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
// Detect a Lead Type filter in a question. "agent" only counts as a type when it's "agent lead(s)"
// (so "agent performance" still routes to the performance report, not the Agent lead type).
// Current Amber Homes launch focus (mirrors the "Upcoming Launches" Founder's Knowledge entry).
// strong = area/developer/project-specific keywords; weak = generic intent keywords. A lead matches a
// launch when it hits >=1 strong keyword OR >=2 weak ones. All framed as internal view — verify before sharing.
const LAUNCHES = [
  { key: "palm-central", name: "Palm Central", developer: "Nakheel", area: "Palm Jebel Ali",
    status: "Collecting EOIs · launch expected this month",
    buyer: "Palm Jebel Ali / waterfront buyers, Golden Visa entry, long-term capital, clients priced out of Palm Jebel Ali villas",
    pitch: "Long-term Palm Jebel Ali waterfront entry — apartments for buyers priced out of the villas. Don't promise appreciation; verify EOI amount, launch date, starting price and payment plan first.",
    aliases: /palm central|palm jebel ali|\bpja\b/,
    strong: ["palm jebel ali", "palm jumeirah", "nakheel", "palm"], weak: ["waterfront", "sea view", "beachfront", "luxury apartment", "golden visa", "investment", "capital appreciation", "dubai islands"] },
  { key: "yas-orchid", name: "Yas Orchid", developer: "Aldar", area: "Yas Island, Abu Dhabi",
    status: "Expected to launch on Yas Island, Abu Dhabi",
    buyer: "Abu Dhabi / Yas Island buyers, Aldar fans, family communities, long-term end-users",
    pitch: "Abu Dhabi family/end-user play; compare with Yas Acres / Yas Park Gate / Yas Park Views. Verify official name, prices, payment plan, handover and availability.",
    aliases: /yas orchid|yas island|\byas\b|abu dhabi|aldar/,
    strong: ["abu dhabi", "yas island", "yas", "aldar", "yas acres", "yas park"], weak: ["family", "townhouse", "villa", "end-user", "end user", "community", "long-term"] },
  { key: "al-ghadeer", name: "Al Ghadeer Gardens", developer: "(verify)", area: "Dubai–Abu Dhabi border / Dubai South direction",
    status: "Expected near the Dubai–Abu Dhabi border",
    buyer: "Affordable family living, Dubai–Abu Dhabi connectivity, Al Maktoum Airport / infrastructure story",
    pitch: "Connectivity + airport/infrastructure growth story for value-driven family buyers. Verify developer, official name, pricing, payment plan, launch status and exact location.",
    aliases: /al ghadeer|ghadeer/,
    strong: ["al ghadeer", "ghadeer"], weak: ["affordable", "family", "dubai south", "abu dhabi", "connectivity", "al maktoum", "airport", "townhouse", "value", "long-term"] },
  { key: "raw-district", name: "Raw District", developer: "Imtiaz", area: "Sheikh Zayed Road",
    status: "Launched on Sheikh Zayed Road",
    buyer: "Sheikh Zayed Road / central Dubai, branded lifestyle, apartment investors",
    pitch: "Prime SZR location + lifestyle branding for central-Dubai investors. Verify pricing, unit types, payment plan, handover and availability.",
    aliases: /raw district|imtiaz/,
    strong: ["sheikh zayed road", "szr", "imtiaz"], weak: ["central dubai", "apartment", "investment", "business bay", "downtown", "urban", "lifestyle", "branded"] },
  { key: "hayat", name: "Hayat Townhouses", developer: "(verify)", area: "Dubai South",
    status: "Launching townhouses in Dubai South",
    buyer: "Townhouse / family buyers, Dubai South, Al Maktoum Airport growth, affordable family community",
    pitch: "Townhouse/family leads wanting space, community and growth near Al Maktoum Airport. Verify developer, official name, pricing, payment plan, handover and availability.",
    aliases: /\bhayat\b|dubai south townhouse|townhouse[^.]*dubai south|dubai south[^.]*townhouse/,
    strong: ["dubai south", "townhouse", "al maktoum"], weak: ["family", "airport", "affordable", "villa", "end-user", "end user", "space", "community", "long-term"] },
  { key: "emaar-stock", name: "Emaar existing stock", developer: "Emaar", area: "Dubai Hills, Emaar South, The Valley, The Oasis, Dubai Creek Harbour, Downtown",
    status: "Ready / available Emaar inventory",
    buyer: "Buyers wanting developer trust, resale liquidity, family communities, safer long-term positioning",
    pitch: "Safer-developer + resale-liquidity buyers in Dubai Hills, Emaar South, The Valley, The Oasis, Creek Harbour or Downtown — depending on availability. Verify live availability and pricing.",
    aliases: /emaar/,
    strong: ["emaar", "dubai hills", "emaar south", "the valley", "the oasis", "dubai creek harbour", "creek harbour", "the oasis"], weak: ["downtown", "family", "resale", "ready", "villa", "townhouse", "apartment", "safer"] },
  { key: "binghatti-wraith", name: "Binghatti Wraith", developer: "Binghatti", area: "Al Jaddaf",
    status: "Launching in Al Jaddaf",
    buyer: "Al Jaddaf, Business Bay/Downtown proximity, branded architecture, apartment investors",
    pitch: "Central Al Jaddaf + Binghatti branded architecture for apartment investors. Verify launch details, pricing, payment plan, unit mix, handover and availability.",
    aliases: /binghatti|wraith|al jaddaf|jaddaf/,
    strong: ["binghatti", "al jaddaf", "jaddaf"], weak: ["business bay", "downtown", "apartment", "branded", "central", "investment"] },
];
function resolveLaunch(text) { const t = String(text || "").toLowerCase(); return LAUNCHES.find((x) => x.aliases.test(t)) || null; }
function leadHay(l) { return [l.area, l.project, l.developer, l.property_type, l.purpose, l.budget, l.notes, l.followup_note, l.nationality, l.language, l.client_name].map((x) => String(x || "").toLowerCase()).join(" • "); }
function scoreLeadForLaunch(l, launch) {
  const hay = leadHay(l);
  const sHits = launch.strong.filter((k) => hay.includes(k));
  const wHits = launch.weak.filter((k) => hay.includes(k));
  const qualifies = sHits.length >= 1 || wHits.length >= 2;
  const score = sHits.length * 2 + wHits.length;
  const reasons = [...new Set([...sHits, ...wHits])];
  return { qualifies, score, reasons };
}
// Waterfront / beachfront communities — used to match "waterfront" leads to waterfront deals & projects.
const WATERFRONT_TERMS = ["palm jumeirah", "palm jebel ali", "dubai islands", "emaar beachfront", "dubai marina", "jbr", "bluewaters", "dubai harbour", "dubai maritime", "creek harbour", "rashid yachts", "mina rashid", "port de la mer", "la mer", "jumeirah beach", "beachfront", "waterfront", "sea view", "seaview", "marina"];
const isWaterfrontText = (s) => { const x = String(s || "").toLowerCase(); return WATERFRONT_TERMS.some((w) => x.includes(w)); };
// Parse a budget/price string ("AED 8,000,000", "8M", "8.5 m") into a number, else 0.
function budgetNum(s) {
  const t = String(s || "").toLowerCase().replace(/aed|usd|,|\s/g, "");
  const m = t.match(/([0-9]*\.?[0-9]+)\s*([mk]?)/);
  if (!m) return 0;
  let v = parseFloat(m[1]); if (!v) return 0;
  if (m[2] === "m" || /million/.test(t)) v *= 1e6; else if (m[2] === "k" || /thousand/.test(t)) v *= 1e3;
  return v;
}

// Smart lead score (0-100), computed live from the lead's own fields — no extra queries, no schema.
// It reflects how much attention a lead deserves: temperature, budget size, urgency/recency,
// data completeness and pipeline stage. Returns { score, band, reasons } for display on cards.
function leadScore(l) {
  if (!l) return { score: 0, band: "Low", reasons: [] };
  const reasons = [];
  let s = 0;
  const day = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); };
  const today = new Date().toISOString().slice(0, 10);

  const temp = l.temperature || "";
  if (temp === "Very Hot") { s += 30; reasons.push("Very hot"); }
  else if (temp === "Hot") { s += 24; reasons.push("Hot"); }
  else if (temp === "Warm") { s += 14; reasons.push("Warm"); }
  else if (temp === "Cold") { s += 4; }
  else { s += 8; } // new / unset still has upside

  const b = budgetNum(l.budget);
  if (b >= 1e7) { s += 22; reasons.push("AED 10M+ budget"); }
  else if (b >= 5e6) { s += 18; reasons.push("AED 5M+ budget"); }
  else if (b >= 3e6) { s += 14; reasons.push("strong budget"); }
  else if (b >= 1.5e6) { s += 10; }
  else if (b > 0) { s += 6; }

  const nf = day(l.next_followup), lc = day(l.last_contacted);
  if (nf) {
    if (nf < today) { s += 20; reasons.push("follow-up overdue"); }
    else if (nf === today) { s += 18; reasons.push("follow-up due today"); }
    else { const days = Math.round((new Date(nf).getTime() - new Date(today).getTime()) / 864e5); if (days <= 3) { s += 14; reasons.push("follow-up soon"); } else { s += 8; } }
  } else if (lc) {
    const days = Math.round((new Date(today).getTime() - new Date(lc).getTime()) / 864e5);
    if (days <= 7) { s += 12; reasons.push("contacted recently"); }
    else if (days <= 30) { s += 6; }
    else { s += 2; reasons.push("going cold"); }
  } else { s += 5; reasons.push("needs first contact"); }

  let comp = 0; if (l.area) comp += 3; if (l.property_type) comp += 3; if (b > 0) comp += 3; if (l.purpose) comp += 3;
  s += comp; if (comp <= 3) reasons.push("missing details");

  const st = (l.status || "").toLowerCase();
  if (/eoi|booking|negotiat|offer|spa|won/.test(st)) { s += 12; reasons.push("late-stage"); }
  else if (/qualified|site visit|viewing|meeting|zoom|options sent|shortlist/.test(st)) { s += 8; reasons.push("engaged"); }
  else if (/contacted|first contact|follow/.test(st)) { s += 4; }
  else { s += 2; }

  if (/invest/i.test(l.purpose || "")) s += 4; else if (/end.?user|live|family|own use/i.test(l.purpose || "")) s += 3;

  const score = Math.max(0, Math.min(100, Math.round(s)));
  const band = score >= 75 ? "Hot priority" : score >= 55 ? "Strong" : score >= 35 ? "Warm" : "Low";
  return { score, band, reasons: reasons.slice(0, 3) };
}
// Score how well one of the agent's leads matches an approved hot resale deal (property type, area,
// waterfront affinity, budget proximity, bedrooms). Mirrors the launch scorer's shape.
function scoreLeadForDeal(l, d) {
  const hay = leadHay(l);
  const dealType = String(d.property_type || "").toLowerCase();
  const dealArea = String(d.area || "").toLowerCase();
  let score = 0; const reasons = [];
  if (dealType && hay.includes(dealType)) { score += 3; reasons.push(dealType); }
  if (dealArea && hay.includes(dealArea)) { score += 3; reasons.push(d.area); }
  if (isWaterfrontText(hay) && (isWaterfrontText(dealArea) || isWaterfrontText(d.project_name))) { score += 2; if (!reasons.includes("waterfront")) reasons.push("waterfront"); }
  const lb = budgetNum(l.budget), dp = budgetNum(d.price);
  if (lb && dp) { const r = dp / lb; if (r >= 0.7 && r <= 1.3) { score += 2; reasons.push("budget fit"); } else if (r >= 0.5 && r <= 1.6) { score += 1; } }
  const lbed = String(l.bedrooms || "").replace(/\D/g, ""), dbed = String(d.bedrooms || "").replace(/\D/g, "");
  if (lbed && dbed && lbed === dbed) { score += 1; reasons.push(dbed + "-bed"); }
  return { qualifies: score >= 3, score, reasons: [...new Set(reasons)] };
}
function parseLeadType(text) {
  const t = String(text || "").toLowerCase();
  if (/\bbuyers?\b/.test(t)) return "Buyer";
  if (/\bsellers?\b/.test(t)) return "Seller";
  if (/\btenants?\b/.test(t)) return "Tenant";
  if (/\bagent\s+leads?\b/.test(t)) return "Agent";
  return null;
}

// ===================== CRM REPORTING HELPERS (Master Admin / Admin) =====================
// Parse an explicit time window from the question. Returns {from,to,label} (YYYY-MM-DD, Dubai tz) or null.
function parsePeriod(text) {
  const t = String(text || "").toLowerCase();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); // YYYY-MM-DD
  const [Y, M] = today.split("-").map(Number); // Y, M(1-12)
  const lastDay = (y, m) => new Date(y, m, 0).getDate();
  const first = (y, m) => `${y}-${String(m).padStart(2, "0")}-01`;
  const last = (y, m) => `${y}-${String(m).padStart(2, "0")}-${String(lastDay(y, m)).padStart(2, "0")}`;
  if (/last month|previous month/.test(t)) { let y = Y, m = M - 1; if (m < 1) { m = 12; y--; } return { from: first(y, m), to: last(y, m), label: "last month" }; }
  if (/this month|current month|\bthis mo\b|in (this )?month|\bmonth to date\b|\bmtd\b/.test(t) || /\bmonth\b/.test(t)) return { from: first(Y, M), to: last(Y, M), label: "this month" };
  if (/this year|current year|\bytd\b|year to date/.test(t)) return { from: `${Y}-01-01`, to: `${Y}-12-31`, label: "this year" };
  if (/last week|past week|last 7 days|past 7 days|previous week/.test(t)) { const f = new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); return { from: f, to: today, label: "the last 7 days" }; }
  if (/this week|current week/.test(t)) { const f = new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" }); return { from: f, to: today, label: "this week" }; }
  if (/\btoday\b/.test(t)) return { from: today, to: today, label: "today" };
  return null;
}
// Best-effort extraction of an agent name/email from a reporting question. Returns "" if none.
function extractAgentName(t) {
  const STOP = new Set("this that the a an last next current our my me all every each everyone everybody team teams agents agent leads lead deals deal listings listing properties property company total today now week month year get got close closed closing won win post posted posting listed made make did do does done has have how many much number count of show me give tell about for under by from in on are is were was their his her".split(" "));
  const grab = (re) => { const x = String(t || "").match(re); return x ? x[1] : ""; };
  let cand = grab(/\b([a-z][a-z'’\-]+(?:\s+[a-z][a-z'’\-]+){0,2})['’]s\b/); // possessive: amar's / amar qureshi's
  if (!cand) cand = grab(/\b(?:by|for|of|from|under|assigned to|belonging to)\s+([a-z][a-z'’\-]+(?:\s+[a-z][a-z'’\-]+){0,2})/);
  if (!cand) cand = grab(/\b(?:did|has|have|does|do)\s+([a-z][a-z'’\-]+(?:\s+[a-z][a-z'’\-]+){0,2})\s+(?:get|got|close|closed|won|win|post|posted|list|listed|made|make|submit|submitted|do|done|have|has)\b/);
  if (!cand) cand = grab(/\b(?:leads?|deals?|listings?|properties|sales?)\s+(?:that\s+|which\s+)?([a-z][a-z'’\-]+(?:\s+[a-z][a-z'’\-]+){0,2})\s+(?:got|get|closed|close|posted|listed|made|won|has|have)\b/);
  if (!cand) { const e = String(t || "").match(/([a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,})/); if (e) return e[1]; }
  const toks = String(cand || "").split(/\s+/).filter((w) => w && !STOP.has(w));
  return toks.join(" ").trim();
}
function lev(a, b) {
  a = String(a); b = String(b); const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 9;
  const d = Array.from({ length: m + 1 }, (_, i) => { const r = new Array(n + 1).fill(0); r[0] = i; return r; });
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
// Resolve a name/email to a single profile. Returns {match, candidates, q}. Only admins can read
// other profiles (RLS), so for non-admins this resolves to themselves or nothing.
async function resolveAgent(target) {
  const q = String(target || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!q) return { match: null, candidates: [], q };
  const { data } = await supabase.from("profiles").select("id, full_name, email, role, active").limit(1000);
  const people = (data || []).filter((p) => p.active !== false);
  const nm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (q.includes("@")) { const c = people.filter((p) => nm(p.email) === q); return { match: c.length === 1 ? c[0] : null, candidates: c, q }; }
  let c = people.filter((p) => nm(p.full_name) === q);
  if (c.length === 1) return { match: c[0], candidates: c, q };
  const toks = q.split(" ");
  c = people.filter((p) => { const fn = nm(p.full_name); return toks.every((tk) => fn.includes(tk)); });
  if (c.length === 1) return { match: c[0], candidates: c, q };
  if (c.length > 1) return { match: null, candidates: c, q };
  c = people.filter((p) => { const fn = nm(p.full_name), em = nm(p.email); const fst = fn.split(" ")[0]; return (fst && (fst.startsWith(q) || q.startsWith(fst))) || em.split("@")[0] === q; });
  if (c.length === 1) return { match: c[0], candidates: c, q };
  if (c.length > 1) return { match: null, candidates: c, q };
  const q1 = q.split(" ")[0];
  c = people.filter((p) => { const fst = nm(p.full_name).split(" ")[0]; return lev(fst, q) <= 1 || (q1 && lev(fst, q1) <= 1); });
  return { match: c.length === 1 ? c[0] : null, candidates: c, q };
}

function leadIntent(text, role) {
  let t = String(text || "").toLowerCase();
  const isAdmin = ADMIN_ROLES.includes(role);
  let target = "";
  const m = t.match(/\b(?:for|of|assigned to|under|belonging to)\s+([a-z0-9][a-z0-9 .,'&\-]{1,40})/);
  if (m) target = m[1];
  const poss = t.match(/([a-z][a-z .'\-]{1,30})['’]s\s+(?:performance|leads?|stats|numbers|pipeline)/);
  if (!target && poss) target = poss[1];
  target = target.replace(/\b(today|now|this (week|month|year)|last (week|month)|the (week|month)|me|my|all|our|a|the)\b/g, " ")
                 .replace(/\bleads?\b/g, " ").replace(/[?.!,]+/g, " ").replace(/\s+/g, " ").trim();

  // Lead Type is an add-on filter (attached to the intent at the call site). Strip the type word
  // from the working text so action rules ("hot leads", "overdue leads", "all leads") still match
  // phrases like "hot buyer leads" or "all agent leads".
  const LT = parseLeadType(t);
  if (LT === "Agent") t = t.replace(/\bagent(\s+leads?)/g, "$1");
  else if (LT) t = t.replace(/\b(buyer|seller|tenant)s?\b/g, " ");
  if (LT) t = t.replace(/\s+/g, " ").trim();

  // ===== ADVISORY / OBJECTION / HOW-TO GUARD =====
  // If the agent is asking for mentor help — handling a client objection, what to say, how to pitch,
  // is-it-worth-it, price/bubble concerns — do NOT hijack it with a structured lead/launch/report
  // query. Let it reach the model (which has founder knowledge + objection playbooks). This is what
  // makes Ask Amber feel intelligent instead of returning a canned project/lead dump.
  const _adv =
    /\bclient(s|.?s| is| was| who| that)?\b[^.?!]*\b(say|saying|said|think|thinks|feel|feels|told|worried|concerned|hesitant|object|not sure|unsure|not convinced|cold feet|nervous|doubt|reluctant|pushing back)\b/.test(t)
    || /\b(too )?(expensive|over ?priced|pricey|costly)\b/.test(t)
    || /\bprice\b[^.?!]*\b(high|too much|expensive|issue|problem|concern|drop|reduce|negotiat)\b/.test(t)
    || /\b(bubble|crash|overheated|too risky|risky)\b/.test(t)
    || /\b(objection|rebuttal|push ?back|counter ?argument)\b/.test(t)
    || /\bhow (do|should|can|would|to)\b[^.?!]*\b(respond|reply|handle|deal|pitch|approach|convince|close|counter|sell|answer|tell|say|position|overcome|negotiat|present)\b/.test(t)
    || /\bwhat\b[^.?!]*\b(should|do|can|would|to)\b[^.?!]*\b(say|tell|reply|respond|send|do|pitch)\b/.test(t)
    || /\bhelp me\b[^.?!]*\b(respond|reply|handle|convince|close|counter|pitch|approach|answer|deal|sell|overcome|negotiat|write|draft)\b/.test(t)
    || /\b(respond|reply) to\b/.test(t)
    || /\b(convince|reassure|counter|overcome)\b/.test(t)
    || /\bshould (i|we|my client|the client|they)\b[^.?!]*\b(buy|wait|invest|book|hold|negotiat)\b/.test(t)
    || /\bis (it|this|now|palm|emaar|sobha|the market|dubai)\b[^.?!]*\b(worth|good|safe|right time|a good|overpriced|bubble)\b/.test(t);
  if (_adv) return null;

  // ===== CRM REPORT INTENTS (module-separated; admin-gated in runReportQuery) =====
  // These MUST come before the generic lead rules so "deals"/"commission"/"hot resale" questions
  // are never answered from the leads module or the model's memory. Each maps to ONE CRM module.
  const _period = parsePeriod(text);
  const _agent = extractAgentName(t);
  const dealWords = /\b(close[ds]?|closing|won|win|approv\w*|submitt?ed?|revenue|sales? (?:made|done|closed))\b/;
  // "hot resale / hot deals / resale" phrasing belongs to the LISTINGS module, never the closed-DEALS
  // module — guard the deals branch so e.g. "how many hot resale deals did X post" isn't miscounted.
  const _hotResale = /\bhot\s+(resale|listing|deals?|propert\w*)\b|\bresale\b/.test(t);
  // DEALS module (closed/approved deals) — never hot resale.
  if (!_hotResale && ((/\bdeals?\b/.test(t) && (dealWords.test(t) || /how many|number of|count|total/.test(t))) || /\bclosed?\b[^.]*\bdeals?\b/.test(t))) {
    if (/\bcommission|net to amber|gross|revenue\b/.test(t)) return _agent ? { kind: "commissionByAgent", target: _agent, adminOnly: true, period: _period } : { kind: "commissionAll", adminOnly: true, period: _period };
    return _agent ? { kind: "dealsByAgent", target: _agent, adminOnly: true, period: _period } : { kind: "dealsAll", adminOnly: true, period: _period };
  }
  // Commission / net-to-company on its own.
  if (/\b(net|gross)\b[^.]*\bcommission\b|\bcommission\b[^.]*\b(this|last|month|year|week)\b|\bnet to amber\b|\bcompany revenue\b/.test(t)) {
    return _agent ? { kind: "commissionByAgent", target: _agent, adminOnly: true, period: _period } : { kind: "commissionAll", adminOnly: true, period: _period };
  }
  // HOT RESALE LISTINGS module (agent-posted listings) — never counted as deals.
  if (/\b(hot resale|hot listing|hot propert\w*|resale listing|hot deals?)\b/.test(t) && /\b(how many|post(?:ed|ing)?|listed|listing|count|number of|did|share[ds]?)\b/.test(t)) {
    return _agent ? { kind: "hotResaleByAgent", target: _agent, adminOnly: true, period: _period } : { kind: "hotResaleAll", adminOnly: true, period: _period };
  }
  // LEADS module — a specific agent's lead count for a period ("how many leads did Amar get this month").
  if ((/\bhow many leads\b|\bleads?\b[^.]*\b(count|total|number)\b|\bnumber of leads\b/.test(t)) && _agent) {
    return { kind: "leadCountByAgent", target: _agent, adminOnly: true, period: _period };
  }

  // ---- Launch ↔ lead matching (highest-value: connect upcoming launches to real leads) ----
  const launch = resolveLaunch(text);
  const whichAgents = /which agents|agents (with|who have|holding|should work)/.test(t);
  // "match my/company leads to (upcoming) launches" — all launches at once.
  if (/\bmatch\b[^.]*\blead/.test(t) && /\blaunch/.test(t) && !launch) return { kind: "matchLaunches", target };
  if ((/launch matching report/.test(t) || /\bleads?\b[^.]*\b(for|to)\b[^.]*\bupcoming\b/.test(t)) && !launch) return { kind: "matchLaunches", target };
  // a specific launch/project — fire ONLY for genuine lead-matching intent ("who should I pitch X to",
  // "match my leads to X", "which of my leads fit X", "show my X leads"), NOT for any stray mention of
  // "client"/"lead" (e.g. an objection about that project — those are handled by the advisory guard above).
  const _matchVerb = /\b(match|matches|matching|fits?|suitable|good for|good fit|recommend)\b/.test(t);
  const _whoPitch = /\bwho (should|to|do|can) i (pitch|offer|send|target|approach|show|recommend|call|contact)\b/.test(t);
  const _listLeads = /\b(leads?|clients?|buyers?)\b/.test(t) && /\b(match|fit|suitable|for|interested|want|looking|show|list|find|get|which|my|any|who)\b/.test(t);
  if (launch && (_matchVerb || _whoPitch || _listLeads)) {
    if (whichAgents) return { kind: "matchLaunch", launchKey: launch.key, byAgent: true, adminOnly: true };
    return { kind: "matchLaunch", launchKey: launch.key, target };
  }

  // ---- Match the agent's OWN clients to approved HOT RESALE deals (cross-sell intelligence) ----
  if (/\bmatch\b[^.]*\b(lead|client)s?\b[^.]*\bhot\b/.test(t) || /\bmatch\b[^.]*\bhot (deal|resale|propert)/.test(t) || /\b(hot deals?|hot resale)\b[^.]*\bmatch/.test(t) || /(which|what) (of my )?(lead|client)s?[^.]*\bhot (deal|resale)/.test(t)) {
    return { kind: "matchHotDeals", target };
  }
  // ---- Filter the agent's own leads by property type / waterfront / ready vs off-plan ----
  const PT = t.match(/\b(townhouse|villa|apartment|penthouse|plot|commercial)s?\b/);
  const _leadish = /\b(client|lead|buyer)s?\b/.test(t) || !!LT;   // LT (buyer/seller/tenant) still confirms a lead filter after the type word is stripped
  const _leadishP = /\b(client|lead|buyer|propert)\w*\b/.test(t) || !!LT;
  if (PT && _leadish) return { kind: "byType", ptype: PT[1].charAt(0).toUpperCase() + PT[1].slice(1) };
  if (/\b(waterfront|beachfront|sea ?view)\b/.test(t) && _leadish) return { kind: "byWaterfront" };
  if (/\b(ready|completed|ready[- ]?to[- ]?move)\b/.test(t) && _leadishP && !/off.?plan/.test(t)) return { kind: "byReady", ready: "Ready" };
  if (/\boff.?plan\b/.test(t) && _leadishP) return { kind: "byReady", ready: "Off-plan" };

  // ---- Admin-only report intents (Master Admin / Admin / Sales Manager) ----
  if (/(unassigned|not assigned)\s*leads?/.test(t)) return { kind: "unassigned", adminOnly: true };
  if (isAdmin && (/agent (performance|leaderboard|ranking|scoreboard|stats|numbers)|team performance|(all|every|each|everyone'?s?|the team'?s?)\s*(agents?\s*)?(performance|stats|numbers|leaderboard|ranking|scoreboard)|how (is|are) (the )?(team|agents?|everyone) (doing|performing)|performance (of|across) (all )?(agents?|the team)/.test(t))) return { kind: "perfAll", adminOnly: true };
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
  if (/(created|added|new)\b.*\btoday\b|leads? (created |added )?today|today'?s leads?/.test(t)) return { kind: "today", target };
  if (!target && (/\ball\b[^.]*\bleads?\b|\bevery\b[^.]*\blead|\bentire\b[^.]*\bleads?\b|company.?wide leads?|all (the )?company leads?|total leads?|how many leads|leads? (overview|summary|breakdown|count)|^\s*(show|list|get)( me)?( the| all)? leads\s*$/.test(t))) return { kind: "all", target: "" };
  if (target && /\blead/.test(t)) return { kind: "list", target };
  // Type-only query (e.g. "show me my buyer leads" / "all seller leads") with no other action keyword.
  if (LT && /\blead/.test(t)) return { kind: "all", target: target || "" };
  return null;
}

// Run the lead query against ONLY the data this user may see (agents are hard-filtered to
// their own leads regardless of intent — the security boundary). Admins (master_admin/admin/
// sales_manager) may scope by agent or project and get summary reports. Returns { heading, leads }.
async function runLeadQuery(intent, user) {
  const role = user && user.role;
  const isAgent = role === "agent";
  // Deals / commission / hot-resale / per-agent lead-count reports use OTHER modules and have their
  // own admin gating — route them out before the lead-only role gates below.
  if (["dealsByAgent", "dealsAll", "commissionAll", "commissionByAgent", "hotResaleByAgent", "hotResaleAll", "leadCountByAgent"].includes(intent.kind)) {
    return await runReportQuery(intent, user);
  }
  if (intent.adminOnly && isAgent) {
    return { heading: "That's an admin report — I can only pull your own leads. Try \"show me my hot leads\", \"my latest lead\", or \"my overdue follow-ups\".", leads: [] };
  }
  // Lead data through Ask Amber is limited to the reporting roles. Operational Admin (and marketing/
  // accounts) must not use the assistant as a backdoor to read leads — they get a clear redirect.
  const canBroadLeads = role === "master_admin" || role === "sales_manager";
  if (!isAgent && !canBroadLeads) {
    return { heading: "Lead reports aren't available for your role here. I can still help with deals, projects, hot resale listings, and lead assignment.", leads: [] };
  }
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  const weekAgo = new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  const { data: { user: au } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("leads")
    .select("*")
    .limit(2000);
  if (error) throw error;
  let rows = data || [];
  if (isAgent && au) rows = rows.filter((l) => l.assigned_agent === au.id || l.current_owner === au.id || l.created_by === au.id);
  if (intent.leadType) rows = rows.filter((l) => (l.lead_type || "Buyer") === intent.leadType);

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

  let picked = [], heading = "", matchInfo = {};
  if (intent.kind === "matchLaunch") {
    const launch = LAUNCHES.find((x) => x.key === intent.launchKey) || LAUNCHES[0];
    const scored = rows.map((l) => ({ l, ...scoreLeadForLaunch(l, launch) })).filter((s) => s.qualifies).sort((a, b) => b.score - a.score || hotRank(a.l) - hotRank(b.l));
    const setInfo = (arr) => arr.forEach((s) => { matchInfo[s.l.id] = { match: launch.name, pitch: launch.pitch, reason: "Matches: " + (s.reasons.slice(0, 4).join(", ") || launch.area) }; });
    if (intent.byAgent && !isAgent) {
      const byAg = {};
      scored.forEach((s) => { const a = s.l.assigned_agent_name || (s.l.is_open ? "Open pool" : "Unassigned"); (byAg[a] = byAg[a] || { n: 0, hot: 0, overdue: 0 }); byAg[a].n++; if (hotRank(s.l) <= 1) byAg[a].hot++; if (d10(s.l.next_followup) && d10(s.l.next_followup) < today && s.l.status !== "Closed Won" && s.l.status !== "Closed Lost") byAg[a].overdue++; });
      const top = Object.entries(byAg).sort((a, b) => b[1].n - a[1].n);
      heading = top.length
        ? `${launch.name} (${launch.developer}, ${launch.area}) — ${scored.length} matching lead${scored.length > 1 ? "s" : ""} across ${top.length} agent${top.length > 1 ? "s" : ""}:\n` + top.map(([a, s]) => `• ${a} — ${s.n} lead${s.n > 1 ? "s" : ""} (${s.hot} hot · ${s.overdue} overdue)`).join("\n") + `\n\nPitch: ${launch.pitch}\nVerify the latest launch details with the developer before sharing.`
        : `No leads match ${launch.name} yet.`;
      picked = scored.slice(0, 8).map((s) => s.l); setInfo(scored.slice(0, 8));
    } else {
      picked = scored.map((s) => s.l); setInfo(scored);
      heading = scored.length
        ? `${launch.name} — ${launch.developer} · ${launch.area} · ${launch.status}.\nBest buyer: ${launch.buyer}.\n${scored.length} of ${isAgent ? "your" : "the"} leads look like a fit — pitch angle: ${launch.pitch}\nVerify the latest details with the developer before sharing with clients.`
        : `${launch.name} — ${launch.developer} · ${launch.area}. No clearly-matching ${isAgent ? "leads of yours" : "leads"} yet. Best buyer: ${launch.buyer}. Verify the latest launch details with the developer before sharing.`;
    }
  } else if (intent.kind === "matchLaunches") {
    const perLaunch = {}; LAUNCHES.forEach((x) => { perLaunch[x.key] = []; });
    rows.forEach((l) => {
      let best = null;
      LAUNCHES.forEach((x) => { const sc = scoreLeadForLaunch(l, x); if (sc.qualifies && (!best || sc.score > best.score)) best = { launch: x, ...sc }; });
      if (best) { perLaunch[best.launch.key].push({ l, ...best }); matchInfo[l.id] = { match: best.launch.name, pitch: best.launch.pitch, reason: "Best fit " + best.launch.name + ": " + (best.reasons.slice(0, 3).join(", ") || best.launch.area) }; }
    });
    const lines = LAUNCHES.map((x) => { const arr = perLaunch[x.key]; return arr.length ? `• ${x.name} (${x.developer}) — ${arr.length} lead${arr.length > 1 ? "s" : ""}` : null; }).filter(Boolean);
    const all = []; Object.values(perLaunch).forEach((arr) => arr.forEach((s) => all.push(s)));
    all.sort((a, b) => b.score - a.score || hotRank(a.l) - hotRank(b.l));
    picked = all.slice(0, 8).map((s) => s.l);
    heading = all.length
      ? `${isAgent ? "Your" : "Company"} leads matched to current launches:\n` + lines.join("\n") + `\n\nShowing the strongest ${Math.min(8, picked.length)} below. Ask "who should I pitch <project> to" for a full per-launch list. Verify launch details before sharing.`
      : `I couldn't match ${isAgent ? "your" : "the"} leads to the current launches yet. Add area/project interest to leads, or ask about a specific launch.`;
  } else if (intent.kind === "matchHotDeals") {
    let deals = [];
    try { const { data: hd } = await supabase.from("hot_resale_deals").select("*").eq("status", "Approved").limit(60); deals = hd || []; } catch (e) { deals = []; }
    if (!deals.length) { heading = "There are no approved hot resale deals on the board right now to match against. As soon as one is approved, I'll match it to your clients."; picked = []; }
    else {
      const scored = rows.map((l) => {
        let best = null;
        deals.forEach((d) => { const sc = scoreLeadForDeal(l, d); if (sc.qualifies && (!best || sc.score > best.score)) best = { d, ...sc }; });
        return best ? { l, ...best } : null;
      }).filter(Boolean).sort((a, b) => b.score - a.score || hotRank(a.l) - hotRank(b.l));
      scored.forEach((s) => {
        const where = [s.d.area, s.d.property_type].filter(Boolean).join(" · ");
        matchInfo[s.l.id] = { match: (s.d.project_name || "Resale unit") + (where ? " — " + where : ""),
          reason: "Matches: " + (s.reasons.slice(0, 4).join(", ") || s.d.property_type || s.d.area),
          pitch: "Share this resale with " + (s.l.client_name || "your client") + " and offer a quick call. Price " + (s.d.price || "on request") + " — subject to availability." };
      });
      picked = scored.map((s) => s.l);
      heading = scored.length
        ? `${scored.length} of your client${scored.length > 1 ? "s" : ""} match a current hot resale deal${scored.length > 8 ? " (top 8)" : ""}. Start here:`
        : "None of your current clients clearly match an approved hot resale deal yet. Add area/budget/type detail to your leads, or ask me to match them to upcoming launches instead.";
    }
  } else if (intent.kind === "byType") {
    const pt = String(intent.ptype || "").toLowerCase();
    picked = rows.filter((l) => String(l.property_type || "").toLowerCase().includes(pt) || leadHay(l).includes(pt)).sort((a, b) => hotRank(a) - hotRank(b) || byNew(a, b));
    heading = picked.length ? `${picked.length} ${isAgent ? "of your " : ""}${intent.ptype.toLowerCase()} client${picked.length > 1 ? "s" : ""}${picked.length > 8 ? " (top 8)" : ""}:` : `No ${intent.ptype.toLowerCase()} clients found in ${isAgent ? "your" : "the"} leads yet.`;
  } else if (intent.kind === "byWaterfront") {
    picked = rows.filter((l) => isWaterfrontText(leadHay(l))).sort((a, b) => hotRank(a) - hotRank(b) || byNew(a, b));
    heading = picked.length ? `${picked.length} ${isAgent ? "of your " : ""}waterfront / beachfront client${picked.length > 1 ? "s" : ""}${picked.length > 8 ? " (top 8)" : ""}:` : `No waterfront clients found in ${isAgent ? "your" : "the"} leads yet. I look for Palm, Marina, Beachfront, Dubai Islands, Harbour and similar.`;
  } else if (intent.kind === "byReady") {
    const want = intent.ready === "Ready" ? "ready" : "off";
    picked = rows.filter((l) => { const v = String(l.ready_offplan || "").toLowerCase(); return want === "ready" ? /ready|complete|secondary/.test(v) : /off|plan|under con|pre.?launch/.test(v); }).sort((a, b) => hotRank(a) - hotRank(b) || byNew(a, b));
    heading = picked.length ? `${picked.length} ${isAgent ? "of your " : ""}${intent.ready} client${picked.length > 1 ? "s" : ""}${picked.length > 8 ? " (top 8)" : ""}:` : `No ${intent.ready} clients recorded in ${isAgent ? "your" : "the"} leads yet (the lead's Ready/Off-plan field needs to be set).`;
  } else if (intent.kind === "latest") {
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
    if (!isAgent && rows.length) {
      const ym = today.slice(0, 7), yyyy = today.slice(0, 4);
      const qs = Math.floor((parseInt(today.slice(5, 7), 10) - 1) / 3) * 3 + 1;
      const qMonths = [qs, qs + 1, qs + 2].map((m) => yyyy + "-" + String(m).padStart(2, "0"));
      const monthN = rows.filter((l) => (createdOf(l) || "").slice(0, 7) === ym).length;
      const quarterN = rows.filter((l) => qMonths.includes((createdOf(l) || "").slice(0, 7))).length;
      const split = (fn, n = 5) => { const m = {}; rows.forEach((l) => { const k = (fn(l) || "—").toString().trim() || "—"; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(" · "); };
      const hotN = rows.filter((l) => hotRank(l) <= 1).length, warmN = rows.filter((l) => l.temperature === "Warm").length;
      const lines = [
        `${scopeLabel}: ${rows.length} assigned lead${rows.length > 1 ? "s" : ""} · ${hotN} hot · ${warmN} warm · ${rows.length - hotN - warmN} cold · ${overdueOf(open).length} overdue.`,
        `This month: ${monthN} · This quarter: ${quarterN}.`,
        `Projects: ${split((l) => l.project)}`,
        `Areas: ${split((l) => l.area)}`,
        `Status: ${split((l) => l.status)}`,
        `Source: ${split((l) => l.source)}`,
      ];
      heading = lines.join("\n") + (picked.length > 8 ? "\nShowing top 8 leads:" : "");
    }
    else heading = picked.length ? `Your leads for ${scopeLabel}:` : `No leads found for ${scopeLabel}.`;
  } else if (intent.kind === "all") {
    picked = [...rows].sort((a, b) => hotRank(a) - hotRank(b) || byNew(a, b));
    const won = rows.filter((l) => l.status === "Closed Won").length, lost = rows.filter((l) => l.status === "Closed Lost").length;
    heading = rows.length ? `${rows.length} ${isAgent ? "" : "total "}lead${rows.length > 1 ? "s" : ""}${forLbl} · ${tempSplit(rows)} · ${overdueOf(open).length} overdue · ${won} won / ${lost} lost.` + (picked.length > 8 ? " Showing the 8 highest-priority:" : "") : `No leads found${forLbl}.`;
  } else if (intent.kind === "today") {
    picked = rows.filter((l) => createdOf(l) === today).sort(byNew);
    heading = picked.length ? `${picked.length} lead${picked.length > 1 ? "s" : ""} created today${forLbl}:` : `No leads created today${forLbl}.`;
  } else if (intent.kind === "perfAll") {
    const byAg = {};
    rows.forEach((l) => { const a = l.assigned_agent_name || "Unassigned"; (byAg[a] = byAg[a] || { total: 0, hot: 0, overdue: 0, won: 0, lost: 0 }); const live = l.status !== "Closed Won" && l.status !== "Closed Lost"; byAg[a].total++; if (hotRank(l) <= 1 && live) byAg[a].hot++; if (d10(l.next_followup) && d10(l.next_followup) < today && live) byAg[a].overdue++; if (l.status === "Closed Won") byAg[a].won++; if (l.status === "Closed Lost") byAg[a].lost++; });
    const rowsA = Object.entries(byAg).sort((a, b) => b[1].won - a[1].won || b[1].total - a[1].total).slice(0, 15);
    heading = rowsA.length ? "Agent performance (leads · hot · overdue · won/lost):\n" + rowsA.map(([a, s]) => `• ${a} — ${s.total} leads · ${s.hot} hot · ${s.overdue} overdue · ${s.won}W/${s.lost}L`).join("\n") : "No agent data yet.";
    picked = [];
  } else { // plan — proactive daily briefing (leads + follow-ups + colleagues' hot deals + launches)
    const overdue = overdueOf(open).sort(byDue);
    const due = open.filter((l) => d10(l.next_followup) === today);
    const hot = open.filter((l) => hotRank(l) <= 1 && d10(l.next_followup) !== today && !overdue.includes(l) && !due.includes(l));
    const noDate = open.filter((l) => !d10(l.next_followup) && !hot.includes(l) && !overdue.includes(l) && !due.includes(l));

    // Cross-sell: pull the approved hot-resale board (colleagues' postings) and match it to this
    // agent's open leads, so the brief can say "X just posted a villa — pitch it to <client>".
    let deals = [];
    try { const { data: hd } = await supabase.from("hot_resale_deals").select("*").eq("status", "Approved").order("created_at", { ascending: false }).limit(60); deals = hd || []; } catch (e) { deals = []; }
    const dealNew = (d) => createdOf(d) && createdOf(d) >= weekAgo; // posted in the last 7 days
    const crossSell = [];
    open.forEach((l) => { let best = null; deals.forEach((d) => { const sc = scoreLeadForDeal(l, d); if (sc.qualifies && (!best || sc.score > best.score)) best = { d, ...sc }; }); if (best) crossSell.push({ l, ...best }); });
    crossSell.sort((a, b) => (Number(dealNew(b.d)) - Number(dealNew(a.d))) || b.score - a.score || hotRank(a.l) - hotRank(b.l));

    // Upcoming launches matched to this agent's open leads.
    const launchMatch = {}; LAUNCHES.forEach((x) => { launchMatch[x.key] = []; });
    open.forEach((l) => { let best = null; LAUNCHES.forEach((x) => { const sc = scoreLeadForLaunch(l, x); if (sc.qualifies && (!best || sc.score > best.score)) best = { launch: x, ...sc }; }); if (best) launchMatch[best.launch.key].push(l); });
    const launchLines = LAUNCHES.map((x) => { const arr = launchMatch[x.key]; if (!arr.length) return null; const names = arr.slice(0, 3).map((l) => l.client_name || "a lead").join(", "); return `Launching: ${x.name} (${x.developer}, ${x.area}) — you have ${arr.length} lead${arr.length > 1 ? "s" : ""} who could fit (${names}${arr.length > 3 ? ", +" + (arr.length - 3) + " more" : ""}). Pitch angle: ${x.pitch}`; }).filter(Boolean);

    // Assemble the brief.
    const parts = [];
    if (open.length) {
      const hotN = open.filter((l) => hotRank(l) <= 1).length, warmN = open.filter((l) => l.temperature === "Warm").length;
      parts.push(`${isAgent ? "You have" : (scopeLabel || "The team") + " has"} ${open.length} open lead${open.length > 1 ? "s" : ""} — ${hotN} hot, ${warmN} warm. ${due.length} due today, ${overdue.length} overdue.`);
    } else {
      parts.push(isAgent ? "No open leads on your desk right now." : `No open leads${forLbl}.`);
    }
    if (overdue.length || due.length) parts.push(`First, clear your follow-ups: ${due.length} due today${overdue.length ? " and " + overdue.length + " overdue (do these first)" : ""}.`);

    const csTop = crossSell.slice(0, 3);
    csTop.forEach((s) => {
      const what = [s.d.bedrooms ? s.d.bedrooms + "BR" : "", s.d.property_type || "", s.d.project_name ? "at " + s.d.project_name : (s.d.area ? "in " + s.d.area : "")].filter(Boolean).join(" ").trim() || "a resale unit";
      const poster = (dealNew(s.d) && s.d.agent_name) ? s.d.agent_name + " just posted" : (dealNew(s.d) ? "Just posted on the board" : "Hot deal on the board");
      parts.push(`${poster}: ${what} — pitch it to ${s.l.client_name || "your client"} (${s.reasons.slice(0, 2).join(", ") || "good fit"}). Price ${s.d.price || "on request"}.`);
    });

    launchLines.slice(0, 2).forEach((ln) => parts.push(ln));

    if (open.length && !overdue.length && !due.length && !csTop.length && !launchLines.length) {
      parts.push("None of your leads have follow-up dates and nothing matches the launches or hot-deal board yet. Set follow-up dates on your hot leads so I can sequence your day — the cards below are who to touch first.");
    } else if (!open.length && (csTop.length || launchLines.length)) {
      parts.push("Pipeline's clear, but there's movement above worth acting on — and a good time to claim open leads or chase referrals.");
    } else if (!open.length) {
      parts.push("Pipeline's clear. Good window to claim open leads, chase referrals, and add follow-up dates as new leads come in so I can build your day.");
    } else {
      parts.push("Work the cards below top to bottom.");
    }
    heading = parts.join("\n");

    // Prioritised cards: follow-ups, hot, cross-sell-matched, then undated — dedup + annotate matches.
    const seen = new Set(); picked = [];
    const add = (l) => { if (l && !seen.has(l.id)) { seen.add(l.id); picked.push(l); } };
    overdue.forEach(add); due.forEach(add); hot.forEach(add);
    csTop.forEach((s) => add(s.l)); noDate.slice(0, 5).forEach(add);
    crossSell.forEach((s) => { if (seen.has(s.l.id) && !matchInfo[s.l.id]) { const where = [s.d.area, s.d.property_type].filter(Boolean).join(" · "); matchInfo[s.l.id] = { match: (s.d.project_name || "Resale unit") + (where ? " — " + where : ""), reason: "Matches: " + (s.reasons.slice(0, 3).join(", ") || s.d.property_type || s.d.area), pitch: "Share with " + (s.l.client_name || "your client") + " and offer a quick call. Price " + (s.d.price || "on request") + " — subject to availability." }; } });
  }

  const reasonFor = (l) => {
    const bits = []; const s = d10(l.next_followup);
    if (hotRank(l) === 0) bits.push("Very hot"); else if (hotRank(l) === 1) bits.push("Hot lead");
    if (s && s < today) bits.push("follow-up overdue"); else if (s === today) bits.push("follow-up due today"); else if (!s) bits.push("no follow-up set");
    if (!isAgent && l.assigned_agent_name) bits.push("agent: " + l.assigned_agent_name);
    if (l.project) bits.push("interest: " + l.project);
    return bits.join(" · ") || "Worth a touch";
  };
  const leads = picked.slice(0, 8).map((l) => {
    const mi = matchInfo[l.id];
    return {
      id: l.id, name: l.client_name || "Lead", code: l.lead_code || l.lead_no || "", project: l.project || l.area || "—", area: l.area || "",
      status: l.is_open ? "Open" : (l.status || "—"), temp: l.temperature || "—", budget: l.budget || "",
      due: fmtDue(l.next_followup), phone: l.phone || "", lead_type: l.lead_type || "Buyer", score: leadScore(l).score,
      reason: mi ? mi.reason : reasonFor(l), match: mi ? mi.match : null, pitch: mi ? mi.pitch : null,
    };
  });
  if (intent.leadType && heading && !new RegExp(intent.leadType, "i").test(heading)) heading = intent.leadType + " leads — " + heading;
  return { heading, leads };
}

// CRM reporting against the CORRECT module only — exact numbers computed here in JS from real rows,
// never by the model. Permissions: deals/commission = Master Admin + Admin (deals RLS); per-agent
// lead counts = Master Admin (full leads visibility); hot-resale reports = Master Admin + Admin.
async function runReportQuery(intent, user) {
  const role = user && user.role;
  const isAdminRole = role === "master_admin" || role === "admin";
  const isMaster = role === "master_admin";
  const period = intent.period || null;
  const periodLabel = period ? period.label : "all time";
  const within = (ts) => { if (!period) return true; const d = String(ts || "").slice(0, 10); return d >= period.from && d <= period.to; };
  const money = (n) => "AED " + Math.round(Number(n || 0)).toLocaleString("en-US");
  const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const d10 = (v) => String(v || "").slice(0, 10);

  if (!isAdminRole) return { heading: "Company reports (deals, commissions, other agents' leads or listings) are available to Master Admin / Admin only. I can still help you with your own leads, deals, listings and clients.", leads: [] };

  // Resolve the target agent (RLS: only admins can read other profiles).
  let agent = null;
  if (intent.target) {
    const r = await resolveAgent(intent.target);
    if (!r.match && (!r.candidates || r.candidates.length === 0)) return { heading: `I couldn't find an agent matching "${intent.target}". Check the spelling, or use their full name or email.`, leads: [] };
    if (!r.match && r.candidates.length > 1) return { heading: `More than one agent matches "${intent.target}": ${r.candidates.map((c) => c.full_name || c.email).join(", ")}. Which one do you mean?`, leads: [] };
    agent = r.match;
  }

  // ---------- DEALS (closed/approved) + COMMISSION — Deals module ONLY ----------
  if (["dealsByAgent", "dealsAll", "commissionAll", "commissionByAgent"].includes(intent.kind)) {
    const { data, error } = await supabase.from("deals").select("*").eq("deleted", false);
    if (error) throw error;
    let deals = (data || []).filter((d) => d.status === "approved");
    if (agent) deals = deals.filter((d) => d.agent_id === agent.id || d.created_by === agent.id);
    const dealDate = (d) => d.decided_at || d.submitted_at || d.created_at;
    deals = deals.filter((d) => within(dealDate(d)));
    const n = deals.length;
    const gross = deals.reduce((s, d) => s + Number(d.gross_commission || 0), 0);
    const net = deals.reduce((s, d) => s + Number(d.net_commission || d.final_net || 0), 0);
    const val = deals.reduce((s, d) => s + Number(d.property_value || 0), 0);
    const who = agent ? agent.full_name : "The team";
    const src = "\n\n(Source: Deals module — approved deals only. Hot resale listings are NOT counted as closed deals.)";
    if (intent.kind === "commissionAll" || intent.kind === "commissionByAgent") {
      if (!n) return { heading: `${who} had no approved closed deals ${periodLabel}, so commission is AED 0.` + src, leads: [] };
      return { heading: `${who} — ${periodLabel}:\nApproved closed deals: ${n}\nGross commission: ${money(gross)}\nNet to Amber Homes: ${money(net)}` + src, leads: [] };
    }
    if (!n) return { heading: `${who} ${agent ? "has" : "had"} no approved closed deals ${periodLabel}.` + src, leads: [] };
    const lines = deals.sort((a, b) => String(dealDate(b)).localeCompare(String(dealDate(a)))).slice(0, 10).map((d) => {
      const bits = [d.project || d.area || "Deal", d.property_type, d.property_value ? money(d.property_value) : null, d.gross_commission ? "gross " + money(d.gross_commission) : null].filter(Boolean);
      return "• " + bits.join(" · ");
    });
    const head = agent
      ? `${agent.full_name} has ${n} approved closed deal${n > 1 ? "s" : ""} ${periodLabel}.\nValue: ${money(val)} · Gross commission: ${money(gross)} · Net to Amber Homes: ${money(net)}\n\n` + lines.join("\n") + src
      : `${n} approved closed deal${n > 1 ? "s" : ""} ${periodLabel} across the team.\nValue: ${money(val)} · Gross commission: ${money(gross)} · Net to Amber Homes: ${money(net)}\n\n` + lines.join("\n") + src;
    return { heading: head, leads: [] };
  }

  // ---------- HOT RESALE LISTINGS — Hot resale module ONLY (never deals) ----------
  if (intent.kind === "hotResaleByAgent" || intent.kind === "hotResaleAll") {
    const { data, error } = await supabase.from("hot_resale_deals").select("*");
    if (error) throw error;
    let hot = data || [];
    if (agent) hot = hot.filter((d) => d.agent_id === agent.id || norm(d.agent_name) === norm(agent.full_name));
    hot = hot.filter((d) => within(d.created_at));
    const n = hot.length;
    const approved = hot.filter((d) => d.status === "Approved").length;
    const pending = hot.filter((d) => d.status === "Pending Approval").length;
    const who = agent ? agent.full_name : "The team";
    const src = "\n\n(Source: Hot Resale board — these are property LISTINGS, not closed deals.)";
    if (!n) return { heading: `${who} ${agent ? "has" : "had"} no hot resale listings ${periodLabel}.` + src, leads: [] };
    const lines = hot.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 10).map((d) => "• " + [d.project_name, d.area, d.property_type, d.price, d.status].filter(Boolean).join(" · "));
    return { heading: `${who} — ${n} hot resale listing${n > 1 ? "s" : ""} ${periodLabel} (${approved} approved · ${pending} pending).\n` + lines.join("\n") + src, leads: [] };
  }

  // ---------- LEAD COUNT for one agent — Leads module (Master Admin only: full leads visibility) ----------
  if (intent.kind === "leadCountByAgent") {
    if (!isMaster) return { heading: "Exact per-agent lead counts are available to Master Admin only here (full lead visibility). I can still help with deals, listings and assignment.", leads: [] };
    if (!agent) return { heading: "Tell me which agent — e.g. \"how many leads did Amar get this month\".", leads: [] };
    const { data, error } = await supabase.from("leads").select("*").limit(5000);
    if (error) throw error;
    const mine = (data || []).filter((l) => l.assigned_agent === agent.id || l.current_owner === agent.id || l.created_by === agent.id);
    const createdOf = (l) => d10(l.created_at) || d10(l.created_on);
    const inP = mine.filter((l) => within(createdOf(l)));
    const n = inP.length;
    const hotRank = (l) => (l.temperature === "Very Hot" ? 0 : l.temperature === "Hot" ? 1 : l.temperature === "Warm" ? 2 : 3);
    const hot = inP.filter((l) => hotRank(l) <= 1).length;
    const warm = inP.filter((l) => l.temperature === "Warm").length;
    const cold = n - hot - warm;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
    const live = inP.filter((l) => l.status !== "Closed Won" && l.status !== "Closed Lost");
    const overdue = live.filter((l) => d10(l.next_followup) && d10(l.next_followup) < today).length;
    const latest = [...inP].sort((a, b) => (createdOf(b) || "").localeCompare(createdOf(a) || ""))[0];
    let h = `${agent.full_name} got ${n} lead${n !== 1 ? "s" : ""} ${periodLabel}.`;
    if (n) h += `\n\nHot: ${hot}\nWarm: ${warm}\nCold/New: ${cold}\nOverdue follow-ups: ${overdue}` + (latest ? `\nLast lead received: ${createdOf(latest)}` : "") + `\n\nWant me to show ${(agent.full_name || "their").split(" ")[0]}'s latest leads?`;
    else h += " (Source: Leads module.)";
    return { heading: h, leads: [] };
  }

  return { heading: "I couldn't run that report.", leads: [] };
}

// Lightweight, safe markdown renderer for Ask Amber answers: **bold**, headings (#),
// bullet/numbered lists, clean paragraphs and line breaks. No raw markdown shown, no lone
// punctuation lines, and long tokens wrap instead of overflowing on mobile.
function richInline(s, keyBase) {
  const parts = []; let last = 0, m, idx = 0;
  // markdown link [label](url) | **bold** / __bold__ | bare http(s) url
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|(https?:\/\/[^\s)]+)/g;
  const isMap = (u) => /google\.[a-z.]+\/maps|maps\.google|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(u);
  const looksUrl = (x) => /^https?:\/\//i.test(String(x || ""));
  const linkEl = (url, label) => {
    const lbl = label && !looksUrl(label) ? label : null;
    return isMap(url)
      ? <a key={keyBase + "-l" + idx++} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", margin: "2px 0", borderRadius: 999, background: T.goldSoft, border: `1px solid ${T.goldEdge}`, color: T.gold, fontWeight: 700, fontSize: 11.5, textDecoration: "none", whiteSpace: "nowrap" }}><MapPin size={12} /> {lbl || "Open in Google Maps"}</a>
      : <a key={keyBase + "-l" + idx++} href={url} target="_blank" rel="noopener noreferrer" style={{ color: T.gold, textDecoration: "underline", wordBreak: "break-word" }}>{lbl || url}</a>;
  };
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    if (m[2]) parts.push(linkEl(m[2], m[1]));
    else if (m[3] || m[4]) parts.push(<strong key={keyBase + "-b" + idx++}>{m[3] || m[4]}</strong>);
    else if (m[5]) parts.push(linkEl(m[5], null));
    last = re.lastIndex;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}
function RichText({ text }) {
  const lines = String(text || "").split("\n");
  const blocks = []; let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };
  lines.forEach((raw) => {
    const t = raw.trim();
    if (!t) { flush(); return; }
    if (/^[•·.\-–—*_=]+$/.test(t)) return; // drop lone punctuation / divider lines
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flush(); blocks.push({ type: "h", level: h[1].length, text: h[2] }); return; }
    const b = t.match(/^[-*•]\s+(.*)$/);
    if (b) { if (!list || list.type !== "ul") { flush(); list = { type: "ul", items: [] }; } list.items.push(b[1]); return; }
    const o = t.match(/^(\d+)[.)]\s+(.*)$/);
    if (o) { if (!list || list.type !== "ol") { flush(); list = { type: "ol", items: [] }; } list.items.push(o[2]); return; }
    flush(); blocks.push({ type: "p", text: t });
  });
  flush();
  return <div style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>{blocks.map((bl, i) => {
    if (bl.type === "h") return <div key={i} style={{ fontWeight: 800, fontSize: bl.level <= 1 ? 14 : 13.2, margin: i ? "9px 0 3px" : "0 0 3px", color: T.ink }}>{richInline(bl.text, i)}</div>;
    if (bl.type === "ul") return <ul key={i} style={{ margin: "4px 0", paddingLeft: 18 }}>{bl.items.map((it, j) => <li key={j} style={{ marginBottom: 2 }}>{richInline(it, i + "-" + j)}</li>)}</ul>;
    if (bl.type === "ol") return <ol key={i} style={{ margin: "4px 0", paddingLeft: 18 }}>{bl.items.map((it, j) => <li key={j} style={{ marginBottom: 2 }}>{richInline(it, i + "-" + j)}</li>)}</ol>;
    return <p key={i} style={{ margin: i ? "5px 0 0" : 0 }}>{richInline(bl.text, i)}</p>;
  })}</div>;
}
// ===== Web Push (phone notifications, e.g. a lead assigned to an agent) =====
// Public VAPID key — safe to ship in the client. The matching private key lives in Vercel env.
const VAPID_PUBLIC_KEY = "BGtO2OLPolZaayF5Gt9ANUQ5bMzC9ywTGWK48QSN7_WRcSGBWyXCO5Pr_bADYmYw82MIMhnWffG151BQx1Ron2I";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
// Fire a phone push via the server (templated server-side; auth-gated). Best-effort — never blocks the UI.
async function pushNotify(payload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session && session.access_token;
    if (!token) return;
    await fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(payload) });
  } catch (e) { /* notifications are best-effort */ }
}
const isIosDevice = () => /iphone|ipad|ipod/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalonePwa = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;

async function ensurePushSubscribed() {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
  const j = sub.toJSON();
  const { data: { user: au } } = await supabase.auth.getUser();
  if (!au || !j || !j.keys) return;
  await supabase.from("push_subscriptions").upsert(
    { user_id: au.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent, last_seen: new Date().toISOString() },
    { onConflict: "endpoint" });
}

// Subtle opt-in prompt for phone notifications. iPhone (not yet installed) gets Add-to-Home-Screen steps.
// ===== Device registry (security): record this device; self-sign-out if revoked =====
function getDeviceId() {
  try {
    let id = localStorage.getItem("amber_device_id");
    if (!id) { id = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); localStorage.setItem("amber_device_id", id); }
    return id;
  } catch (e) { return "dev-unknown"; }
}
// 7-day trusted-session token (proves this device already passed 2FA; lets login skip 2FA for 7 days).
function getTrustToken() { try { return localStorage.getItem("amber_trust_token") || ""; } catch (e) { return ""; } }
function setTrustToken(t) { try { if (t) localStorage.setItem("amber_trust_token", t); } catch (e) {} }
function clearTrustToken() { try { localStorage.removeItem("amber_trust_token"); } catch (e) {} }
async function registerDevice() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session && session.access_token;
    if (!token) return null;
    const r = await fetch("/api/session-log", { method: "POST", headers: { "content-type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ device_id: getDeviceId(), user_agent: navigator.userAgent }) });
    const j = await r.json().catch(() => null);
    if (j && j.revoked) { try { await supabase.auth.signOut(); } catch (e) {} try { window.location.reload(); } catch (e) {} }
    return j;
  } catch (e) { return null; }
}

// Admin-only: every device each user is signed in on, with IP, approximate location and device ID.
function DevicesSecurity({ user }) {
  const isAdmin = user && (user.role === "master_admin" || user.role === "admin");
  const [rows, setRows] = useState(null);
  const [profs, setProfs] = useState({});
  const [busy, setBusy] = useState("");
  const [capOn, setCapOn] = useState(false);
  const [capBusy, setCapBusy] = useState(false);
  const load = async () => {
    setRows(null);
    try { const { data: cs } = await supabase.from("app_settings").select("value").eq("key", "device_limit_enabled").maybeSingle(); setCapOn(!(cs && String(cs.value).toLowerCase() === "false")); } catch (e) {}
    const { data: d } = await supabase.from("user_devices")
      .select("id, user_id, device_id, label, user_agent, last_ip, city, region, country, last_seen, first_seen, revoked")
      .order("last_seen", { ascending: false }).limit(1000);
    const list = d || [];
    setRows(list);
    const ids = [...new Set(list.map((r) => r.user_id))];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, full_name, role").in("id", ids);
      const map = {}; (p || []).forEach((x) => { map[x.id] = x; }); setProfs(map);
    }
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
  const toggleCap = async () => {
    setCapBusy(true);
    const next = !capOn;
    try { await supabase.from("app_settings").upsert({ key: "device_limit_enabled", value: next ? "true" : "false" }, { onConflict: "key" }); setCapOn(next); } catch (e) {}
    setCapBusy(false);
  };
  const revoke = async (row, on) => {
    setBusy(row.id);
    try {
      await supabase.from("user_devices").update(on
        ? { revoked: true, revoked_at: new Date().toISOString(), revoked_by: user.id }
        : { revoked: false, revoked_at: null, revoked_by: null }).eq("id", row.id);
      await load();
    } catch (e) {}
    setBusy("");
  };
  if (!isAdmin) return <div style={{ ...card, padding: 24, color: T.muted }}>Admins only.</div>;
  const loc = (r) => [r.city, r.region, r.country].filter(Boolean).join(", ") || "—";
  const shortId = (s) => (s ? String(s).slice(0, 10) + "…" : "—");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: T.muted, maxWidth: 640, lineHeight: 1.5 }}>Every device each user is signed in on, with its IP, approximate location (from the IP) and device ID. "Sign out" forces that device to re-authenticate on its next use.</div>
        <button onClick={load} style={{ ...miniBtn() }}>Refresh</button>
      </div>
      <div style={{ ...card, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: T.ink }}><b>Limit each user to 2 active devices</b><div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>When on, a 3rd sign-in automatically signs out that user's oldest device.</div></div>
        <button onClick={toggleCap} disabled={capBusy} style={{ ...miniBtn(), minWidth: 56, borderColor: capOn ? T.ok : T.hair, color: capOn ? T.ok : T.muted, fontWeight: 700 }}>{capBusy ? "…" : (capOn ? "On" : "Off")}</button>
      </div>
      {rows === null ? <div style={{ color: T.muted, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <div style={{ ...card, padding: 24, color: T.muted }}>No device sign-ins recorded yet. They appear here once users open the app after this update.</div>
        : <div style={{ display: "grid", gap: 10 }}>
            {rows.map((r) => {
              const p = profs[r.user_id] || {};
              return (
                <div key={r.id} style={{ ...card, padding: 14, opacity: r.revoked ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: T.ink }}>{p.full_name || "—"} <span style={{ fontSize: 10.5, color: T.faint, fontWeight: 600 }}>{roleLabel(p.role)}</span></div>
                      <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>{r.label || r.user_agent || "Unknown device"}</div>
                      <div style={{ fontSize: 11, color: T.faint, marginTop: 4, lineHeight: 1.7 }}>
                        IP: {r.last_ip || "—"} &nbsp;·&nbsp; Location: {loc(r)}<br />
                        Device ID: {shortId(r.device_id)} &nbsp;·&nbsp; Last seen: {r.last_seen ? new Date(r.last_seen).toLocaleString("en-GB") : "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: r.revoked ? T.bad : T.ok }}>{r.revoked ? "Signed out" : "Active"}</span>
                      <button onClick={() => revoke(r, !r.revoked)} disabled={busy === r.id} style={{ ...miniBtn(), borderColor: r.revoked ? T.ok : T.bad, color: r.revoked ? T.ok : T.bad }}>{busy === r.id ? "…" : (r.revoked ? "Allow again" : "Sign out")}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
    </div>
  );
}

/* ============================ BREAKDOWN CALCULATOR ============================ */
// Default Dubai resale fees — change here to update everywhere.
const BRK_FEES = { dldPct: 4, agencyPct: 2, vatPct: 5, trustee: 4200, offplanNoc: 5250, saleProgression: 1000, readyTitleAdmin: 580, readyNoc: 5000, mortgageRegPct: 0.25 };
// Brand details (from the official letterhead). The PDF renders on the letterhead image, which already
// carries the logo + contact footer; these are kept for reference and any non-letterhead fallback.
const BRAND_INFO = { name: "Amber Homes Real Estate", office: "2102 Burj Al Salam, Sheikh Zayed Road, Dubai, UAE", website: "amberhomes.ae", email: "info@amberhomes.ae", phone: "+971 4 368 4497", orn: "18690", tl: "778204" };
const BRK_DISCLAIMER = "Disclaimer: This breakdown is for estimation and presentation purposes only. Final charges, DLD fees, trustee fees, NOC fees, mortgage-related charges and developer/admin fees may vary depending on the transaction, developer, bank, Dubai Land Department requirements and trustee office. The buyer and seller should verify all final amounts before signing any agreement.";

function brN(v) { if (typeof v === "number") return Number.isFinite(v) ? v : 0; const n = parseFloat(String(v == null ? "" : v).replace(/,/g, "")); return Number.isFinite(n) ? n : 0; }
const brAed = (n) => "AED " + Math.round(brN(n)).toLocaleString("en-US");
const brNum = (n) => brN(n).toLocaleString("en-US");
function brFmtInput(raw, allowDecimal) {
  if (raw === "" || raw == null) return "";
  let s = String(raw).replace(/,/g, "");
  if (allowDecimal) { s = s.replace(/[^\d.]/g, ""); const i = s.indexOf("."); if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, ""); }
  else s = s.replace(/[^\d]/g, "");
  if (s === "" || s === ".") return s;
  let [ip, dp] = s.split(".");
  ip = ip.replace(/^0+(?=\d)/, "");
  const out = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dp != null ? out + "." + dp : out;
}
function brSafeName(s) { return String(s || "").trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-") || "Client"; }
function brDate(s) { if (!s) return "—"; try { return new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch (e) { return s; } }

// ---- Future developer payment plan (off-plan) ----
const BRK_PAY_STATUS = ["Upcoming", "On Handover", "Post-Handover", "Final Payment", "Paid"];
function planBaseOf(f) { return (f.planBase !== "" && f.planBase != null) ? brN(f.planBase) : brN(f.originalPrice); }
function paymentAmt(row, base) { return (row.lastEdit === "pct" && base > 0 && row.pct !== "" && row.pct != null) ? base * brN(row.pct) / 100 : brN(row.amount); }
function calcFuture(f, r) {
  const base = planBaseOf(f);
  const rows = (f.payments || []).map((p) => ({ ...p, amt: paymentAmt(p, base) }));
  const totalScheduled = rows.reduce((s, p) => s + p.amt, 0);
  const remainingToDev = (r.remainingAfterNoc != null) ? r.remainingAfterNoc : r.remainingToDev;
  const balanceNotScheduled = remainingToDev - totalScheduled;
  const matched = rows.length > 0 && Math.abs(balanceNotScheduled) < 1;
  const upcoming = rows.filter((p) => p.status !== "Paid" && p.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const next = upcoming[0] || rows.find((p) => p.status !== "Paid") || null;
  return { base, rows, totalScheduled, remainingToDev, balanceNotScheduled, matched, next };
}

// ---- Centralized calculations (single source of truth) ----
function calcOffPlan(d) {
  const originalPrice = brN(d.originalPrice), resalePrice = brN(d.resalePrice);
  const amountPaid = d.lastPaidEdit === "pct" ? originalPrice * brN(d.pctPaid) / 100 : brN(d.amountPaid);
  const pctPaid = originalPrice > 0 ? amountPaid / originalPrice * 100 : 0;
  const remainingToDev = originalPrice - amountPaid;
  const autoPremium = resalePrice - originalPrice;
  const premium = (d.premiumVal !== "" && d.premiumVal != null) ? brN(d.premiumVal) : autoPremium;
  const payableToSeller = amountPaid + premium;
  const dld = resalePrice * brN(d.dldPct) / 100, agency = resalePrice * brN(d.agencyPct) / 100, vat = agency * brN(d.vatPct) / 100;
  const trustee = brN(d.trustee), noc = brN(d.noc), saleProg = brN(d.saleProg), other = brN(d.other);
  const totalBuying = dld + agency + vat + trustee + noc + saleProg + other;
  // Developer NOC payment requirement (eligibility to transfer)
  const nocReqPct = brN(d.nocRequiredPercent);
  const hasNoc = nocReqPct > 0;
  const nocRequiredAmount = originalPrice * nocReqPct / 100;
  const additionalForNoc = Math.max(0, nocRequiredAmount - amountPaid);
  const nocMet = !hasNoc || additionalForNoc < 0.5;
  const nocPayer = d.nocPayer || "Buyer";
  let buyerNocShortfall, sellerNocShortfall;
  if (nocPayer === "Seller") { buyerNocShortfall = 0; sellerNocShortfall = additionalForNoc; }
  else if (nocPayer === "Custom split") { buyerNocShortfall = brN(d.buyerNocShare); sellerNocShortfall = brN(d.sellerNocShare); }
  else { buyerNocShortfall = additionalForNoc; sellerNocShortfall = 0; }
  const payableToDevBeforeNoc = buyerNocShortfall;
  const remainingAfterNoc = Math.max(0, originalPrice - amountPaid - additionalForNoc);
  const immediateCash = payableToSeller + buyerNocShortfall + totalBuying;
  return { originalPrice, resalePrice, amountPaid, pctPaid, remainingToDev, autoPremium, premium, isDiscount: premium < 0, payableToSeller, dld, agency, vat, agencyVat: agency + vat, trustee, noc, saleProg, other, totalBuying, immediateCash, totalExcl: resalePrice, totalIncl: resalePrice + totalBuying, hasNoc, nocReqPct, nocRequiredAmount, additionalForNoc, nocMet, nocPayer, buyerNocShortfall, sellerNocShortfall, payableToDevBeforeNoc, remainingAfterNoc };
}
function calcReady(d) {
  const sellingPrice = brN(d.sellingPrice);
  const buyerMortgage = d.mortgageStatus === "Mortgage Buyer" || d.mortgageStatus === "Buyer and Seller Both Mortgage";
  const sellerMortgage = d.mortgageStatus === "Seller Mortgage" || d.mortgageStatus === "Buyer and Seller Both Mortgage";
  const dld = sellingPrice * brN(d.dldPct) / 100, agency = sellingPrice * brN(d.agencyPct) / 100, vat = agency * brN(d.vatPct) / 100;
  const trustee = brN(d.trustee), titleAdmin = brN(d.titleAdmin), noc = brN(d.noc), other = brN(d.other);
  const mortgageReg = buyerMortgage ? brN(d.mortgageAmount) * brN(d.mortgageRegPct) / 100 : 0;
  const mortgageRelease = sellerMortgage ? brN(d.mortgageRelease) : 0;
  const totalBuying = dld + agency + vat + trustee + titleAdmin + noc + mortgageReg + mortgageRelease + other;
  return { sellingPrice, dld, agency, vat, agencyVat: agency + vat, trustee, titleAdmin, noc, mortgageReg, mortgageRelease, other, buyerMortgage, sellerMortgage, totalBuying, totalCash: sellingPrice + totalBuying };
}

// ---- WhatsApp summaries ----
function waOffPlan(d, r, fut) {
  let s = `Hi ${d.clientName || "there"},\nPlease find the estimated off-plan resale breakdown below:\n\nProperty: ${[d.projectName, d.unitNumber].filter(Boolean).join(", ") || "—"}\nOriginal Price: ${brAed(r.originalPrice)}\nResale Price: ${brAed(r.resalePrice)}\nPaid to Developer: ${brAed(r.amountPaid)} (${r.pctPaid.toFixed(1)}%)`;
  if (r.hasNoc) {
    s += `\nRequired for NOC: ${brAed(r.nocRequiredAmount)} (${r.nocReqPct}%)`;
    s += `\nAdditional Needed for NOC: ${brAed(r.additionalForNoc)}`;
  }
  s += `\n${r.isDiscount ? "Seller Discount" : "Seller Premium"}: ${brAed(Math.abs(r.premium))}\nPayable to Seller: ${brAed(r.payableToSeller)}`;
  if (r.hasNoc && r.payableToDevBeforeNoc > 0) s += `\nPayable to Developer Before Transfer: ${brAed(r.payableToDevBeforeNoc)}`;
  s += `\nEstimated Buying Costs: ${brAed(r.totalBuying)}\nImmediate Cash Requirement: ${brAed(r.immediateCash)}`;
  const hasFuture = (fut && fut.rows.length) || d.expectedHandover || brN(d.handoverAmount) > 0 || d.finalDate || brN(d.finalAmount) > 0;
  if (hasFuture) {
    s += "\n\nFuture Payment Plan:";
    if (fut && fut.next) s += `\nNext Payment: ${brAed(fut.next.amt)}${fut.next.dueDate ? " on " + brDate(fut.next.dueDate) : ""}`;
    if (!(fut && fut.rows.length)) {
      if (d.expectedHandover) s += `\nHandover Date: ${brDate(d.expectedHandover)}`;
      if (brN(d.handoverAmount) > 0) s += `\nHandover Payment: ${brAed(d.handoverAmount)}`;
      if (d.finalDate) s += `\nFinal Payment Date: ${brDate(d.finalDate)}`;
      if (brN(d.finalAmount) > 0) s += `\nFinal Payment: ${brAed(d.finalAmount)}`;
    }
    if (fut && fut.rows.length) s += `\nTotal Future Payments: ${brAed(fut.totalScheduled)}`;
  }
  s += `\n\nRemaining Developer Balance / Future Payment Plan: ${brAed(r.remainingAfterNoc)}`;
  return s + (r.hasNoc ? "\n\nPlease note this is an estimate and final NOC/payment requirements must be confirmed by the developer." : "\n\nPlease note this is an estimate and final charges/payment dates may vary as per developer confirmation.");
}
function waReady(d, r) {
  return `Hi ${d.clientName || "there"},\nPlease find the estimated ready property resale breakdown below:\n\nProperty: ${[d.propertyName, d.unitNumber].filter(Boolean).join(", ") || "—"}\nSelling Price: ${brAed(r.sellingPrice)}\nDLD Fee: ${brAed(r.dld)}\nAgency Commission + VAT: ${brAed(r.agencyVat)}\nTrustee / Admin / NOC Charges: ${brAed(r.trustee + r.titleAdmin + r.noc)}\nEstimated Buying Costs: ${brAed(r.totalBuying)}\nTotal Cash Requirement: ${brAed(r.totalCash)}\n\nPlease note this is an estimate and final charges may vary.`;
}

// ---- jsPDF + letterhead loaded on demand (own chunks, kept out of the main bundle) ----
let _jspdf = null, _jspdfPromise = null;
function loadJsPdf() {
  if (_jspdf) return Promise.resolve(_jspdf);
  if (!_jspdfPromise) _jspdfPromise = import("jspdf").then((m) => { _jspdf = m.jsPDF || (m.default && m.default.jsPDF) || m.default; return _jspdf; });
  return _jspdfPromise;
}
let _lh = null, _lhPromise = null;
function loadLetterhead() {
  if (_lh) return Promise.resolve(_lh);
  if (!_lhPromise) _lhPromise = import("./letterhead.js").then((m) => { _lh = m.LETTERHEAD_PNG; return _lh; }).catch(() => null);
  return _lhPromise;
}
function buildBreakdownDoc(JsPDF, mode, d, r, user, lh, future) {
  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 52, TOP = 168, BOTTOM = 744;
  const NAVY = [17, 50, 77], SLATE = [92, 104, 120], GREY = [120, 124, 130], LINE = [214, 219, 226], SOFT = [244, 246, 249], RED = [176, 58, 58], GREEN = [40, 120, 80], WHITE = [255, 255, 255];
  const isOff = mode === "offplan";
  function bg() { if (lh) { try { doc.addImage(lh, "PNG", 0, 0, W, H, "amberlh", "FAST"); } catch (e) {} } }
  bg();
  let y = TOP;
  function newPage() { doc.addPage(); bg(); y = TOP; }
  function ensure(h) { if (y + h > BOTTOM) newPage(); }
  doc.setFont("helvetica", "bold"); doc.setTextColor.apply(doc, NAVY); doc.setFontSize(19);
  doc.text(isOff ? "Off-Plan Resale Cost Breakdown" : "Ready Property Resale Cost Breakdown", M, y);
  doc.setDrawColor.apply(doc, NAVY); doc.setLineWidth(2.2); doc.line(M, y + 8, M + 196, y + 8);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor.apply(doc, GREY);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), W - M, y - 4, { align: "right" });
  if (user && user.name) doc.text("Agent: " + user.name, W - M, y + 9, { align: "right" });
  y += 30;
  doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor.apply(doc, NAVY);
  doc.text("Prepared for: " + (d.clientName || "\u2014"), M, y); y += 24;

  const rowH = 21;
  function sect(t) { ensure(32); y += 5; doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor.apply(doc, NAVY); doc.text(t.toUpperCase(), M, y); doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.8); doc.line(M, y + 6, W - M, y + 6); y += 18; }
  function row(label, value, opt) { opt = opt || {}; ensure(rowH); doc.setFont("helvetica", opt.bold ? "bold" : "normal"); doc.setFontSize(opt.bold ? 12.5 : 11.5); doc.setTextColor.apply(doc, opt.color || NAVY); doc.text(label, M + (opt.indent ? 12 : 0), y); doc.text(value, W - M, y, { align: "right" }); doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.4); doc.line(M, y + 7, W - M, y + 7); y += rowH; }
  function totalBar(label, value) { ensure(36); doc.setFillColor.apply(doc, NAVY); doc.roundedRect(M, y - 15, W - 2 * M, 31, 5, 5, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(13.5); doc.setTextColor.apply(doc, WHITE); doc.text(label, M + 14, y + 5); doc.text(value, W - M - 14, y + 5, { align: "right" }); y += 40; }
  function grid(pairs) { const colW = (W - 2 * M) / 2; for (let i = 0; i < pairs.length; i += 2) { ensure(35); [0, 1].forEach((c) => { const p = pairs[i + c]; if (!p) return; const x = M + c * colW; doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, GREY); doc.text(String(p[0]).toUpperCase(), x, y); doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor.apply(doc, NAVY); doc.text(String(p[1] || "\u2014"), x, y + 14); }); y += 35; } }
  const clip = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "\u2026" : s; };

  if (isOff) {
    sect("Property Details");
    grid([["Project", d.projectName], ["Developer", d.developerName], ["Unit", d.unitNumber], ["Property Type", d.propertyType], ["Location", d.location], ["Bedrooms", d.bedrooms], ["Size (sq ft)", d.sizeSqft ? brNum(d.sizeSqft) : ""], ["Original Price", brAed(r.originalPrice)]]);
    sect("Seller Position");
    row("Resale Selling Price", brAed(r.resalePrice));
    row("Amount Paid to Developer", brAed(r.amountPaid) + "  (" + r.pctPaid.toFixed(1) + "%)");
    row(r.isDiscount ? "Seller Discount" : "Seller Premium", brAed(Math.abs(r.premium)), r.isDiscount ? { color: RED } : undefined);
    row("Total Payable to Seller Now", brAed(r.payableToSeller), { bold: true });
    if (r.hasNoc) {
      sect("Developer NOC Payment Requirement");
      row("Minimum Required Payment for NOC (" + r.nocReqPct + "%)", brAed(r.nocRequiredAmount));
      row("Amount Already Paid (" + r.pctPaid.toFixed(1) + "%)", brAed(r.amountPaid));
      row("Additional Payment Needed for NOC", brAed(r.additionalForNoc), { bold: true, color: r.additionalForNoc > 0 ? RED : GREEN });
      row("Who Pays the NOC Shortfall", r.nocPayer + (r.nocPayer === "Custom split" ? " (Buyer " + brAed(r.buyerNocShortfall) + " / Seller " + brAed(r.sellerNocShortfall) + ")" : ""));
      if (r.payableToDevBeforeNoc > 0) row("Payable to Developer Before NOC / Transfer", brAed(r.payableToDevBeforeNoc));
      ensure(32); doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.setTextColor.apply(doc, r.nocMet ? GREEN : GREY);
      const nocNote = r.additionalForNoc > 0
        ? "The developer requires a minimum payment of " + brAed(r.nocRequiredAmount) + " before issuing NOC. Since " + brAed(r.amountPaid) + " has already been paid, an additional " + brAed(r.additionalForNoc) + " is required before NOC / transfer can proceed."
        : "The seller has already paid " + brAed(r.amountPaid) + ", meeting the developer minimum of " + brAed(r.nocRequiredAmount) + " required to issue NOC.";
      const nocLines = doc.splitTextToSize(nocNote, W - 2 * M); doc.text(nocLines, M, y); y += nocLines.length * 13 + 6;
    }
    sect("Transfer & Buying Costs");
    row("DLD Fee (" + brN(d.dldPct) + "%)", brAed(r.dld));
    row("Agency Commission (" + brN(d.agencyPct) + "%)", brAed(r.agency));
    row("VAT on Commission (" + brN(d.vatPct) + "%)", brAed(r.vat));
    row("Trustee Fee", brAed(r.trustee));
    row("Developer NOC / Admin Fee", brAed(r.noc));
    row("Sale Progression Fee", brAed(r.saleProg));
    if (r.other > 0) row("Other Admin Charges", brAed(r.other));
    row("Total Buying Costs", brAed(r.totalBuying), { bold: true });
    y += 6; totalBar("Buyer Immediate Cash Requirement", brAed(r.immediateCash));
    sect("Overall");
    row("Remaining Developer Balance / Future Payment Plan Balance", brAed(r.remainingAfterNoc));
    row("Total Property Cost (excl. buying costs)", brAed(r.totalExcl));
    row("Total Property Cost (incl. buying costs)", brAed(r.totalIncl), { bold: true });

    const f2 = future;
    const hasFuture = f2 && (f2.rows.length || d.expectedHandover || brN(d.handoverAmount) > 0 || d.finalDate || brN(d.finalAmount) > 0 || d.postHandover === "Yes");
    if (f2 && (r.hasNoc || hasFuture)) {
      sect("Remaining Developer Payment Plan");
      row("Total Paid to Developer Before Transfer", brAed(r.amountPaid + r.additionalForNoc));
      row("Remaining Developer Balance / Future Payment Plan Balance", brAed(r.remainingAfterNoc), { bold: true });
      if (f2.rows.length) {
        const notesW = W - 2 * M - (138 + 64 + 32 + 96 + 68);
        const widths = [138, 64, 32, 96, 68, notesW];
        ensure(18);
        let x = M; doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor.apply(doc, SLATE);
        ["Label", "Due", "%", "Amount", "Status", "Notes"].forEach((t, i) => { const rt = (t === "%" || t === "Amount"); doc.text(t.toUpperCase(), rt ? x + widths[i] - 4 : x, y, rt ? { align: "right" } : undefined); x += widths[i]; });
        doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.7); doc.line(M, y + 5, W - M, y + 5); y += 16;
        f2.rows.forEach((p) => {
          ensure(18); const isNext = f2.next && f2.next.id === p.id;
          if (isNext) { doc.setFillColor(236, 241, 247); doc.rect(M - 2, y - 11, W - 2 * M + 4, 18, "F"); }
          x = M; doc.setFont("helvetica", isNext ? "bold" : "normal"); doc.setFontSize(9.5); doc.setTextColor.apply(doc, NAVY);
          doc.text(clip(p.label || "\u2014", 23), x, y); x += widths[0];
          doc.text(p.dueDate ? brDate(p.dueDate) : "\u2014", x, y); x += widths[1];
          doc.text(p.pct !== "" && p.pct != null ? brN(p.pct) + "%" : "\u2014", x + widths[2] - 4, y, { align: "right" }); x += widths[2];
          doc.text(brAed(p.amt), x + widths[3] - 4, y, { align: "right" }); x += widths[3];
          doc.text(clip(p.status || "\u2014", 14), x, y); x += widths[4];
          doc.setTextColor.apply(doc, GREY); doc.setFontSize(8); doc.text(clip(p.notes || "", 20), x, y);
          doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.3); doc.line(M, y + 6, W - M, y + 6); y += 18;
        });
        y += 5;
      }
      if (!f2.rows.length) {
        if (d.expectedHandover) row("Expected Handover Date", brDate(d.expectedHandover));
        if (brN(d.handoverAmount) > 0) row("Handover Payment", brAed(d.handoverAmount));
        if (d.finalDate) row("Final Payment Date", brDate(d.finalDate));
        if (brN(d.finalAmount) > 0) row("Final Payment", brAed(d.finalAmount));
        if (d.postHandover === "Yes") { row("Post-Handover Plan", [d.postHandoverDuration, d.paymentFrequency].filter(Boolean).join(" \u00b7 ") || "Yes"); if (brN(d.postHandoverAmount) > 0) row("Post-Handover Amount", brAed(d.postHandoverAmount)); }
      }
      if (f2.rows.length) {
        row("Total Scheduled Future Payments", brAed(f2.totalScheduled), { bold: true });
        if (Math.abs(f2.balanceNotScheduled) >= 1) row("Balance Not Scheduled", (f2.balanceNotScheduled < 0 ? "\u2212 " : "") + brAed(Math.abs(f2.balanceNotScheduled)), { color: RED });
        ensure(20); doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.setTextColor.apply(doc, f2.matched ? GREEN : RED);
        doc.text(f2.matched ? "Future payment plan matches the remaining developer balance." : "The future payment schedule does not match the remaining developer balance. Please review.", M, y); y += 17;
      }
    }
  } else {
    sect("Property Details");
    grid([["Property / Building", d.propertyName], ["Unit", d.unitNumber], ["Property Type", d.propertyType], ["Location", d.location], ["Bedrooms", d.bedrooms], ["Size (sq ft)", d.sizeSqft ? brNum(d.sizeSqft) : ""], ["Mortgage Status", d.mortgageStatus]]);
    sect("Cost Breakdown");
    row("Property Selling Price", brAed(r.sellingPrice), { bold: true });
    row("DLD Fee (" + brN(d.dldPct) + "%)", brAed(r.dld));
    row("Agency Commission (" + brN(d.agencyPct) + "%)", brAed(r.agency));
    row("VAT on Commission (" + brN(d.vatPct) + "%)", brAed(r.vat));
    row("Trustee Fee", brAed(r.trustee));
    row("Title Deed / Map / Admin Fee", brAed(r.titleAdmin));
    row("Developer NOC Fee", brAed(r.noc));
    if (r.buyerMortgage) row("Mortgage Registration (" + brN(d.mortgageRegPct) + "%)", brAed(r.mortgageReg));
    if (r.sellerMortgage && r.mortgageRelease > 0) row("Mortgage Release / Blocking", brAed(r.mortgageRelease));
    if (r.other > 0) row("Other Charges", brAed(r.other));
    row("Total Buying Costs", brAed(r.totalBuying), { bold: true });
    y += 6; totalBar("Total Buyer Cash Requirement", brAed(r.totalCash));
  }

  ensure(60);
  doc.setFillColor.apply(doc, SOFT); doc.roundedRect(M, y - 2, W - 2 * M, 56, 4, 4, "F");
  doc.setFont("helvetica", "italic"); doc.setFontSize(7.8); doc.setTextColor.apply(doc, GREY);
  doc.text(doc.splitTextToSize(BRK_DISCLAIMER, W - 2 * M - 20), M + 10, y + 10);
  return doc;
}

// ---- Formatted AED / number input (keeps cursor sane, syncs when not focused) ----
function BrNum({ value, onChange, allowDecimal, prefix, suffix, placeholder, invalid }) {
  const [txt, setTxt] = useState(() => brFmtInput(value, allowDecimal));
  const [foc, setFoc] = useState(false);
  useEffect(() => { if (!foc) setTxt(value === "" || value == null ? "" : brFmtInput(value, allowDecimal)); }, [value, foc, allowDecimal]);
  const inp = { width: "100%", border: `1px solid ${invalid ? T.bad : T.hair}`, borderRadius: 10, padding: "10px 12px", paddingLeft: prefix ? 44 : 12, paddingRight: suffix ? 30 : 12, fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.paper, boxSizing: "border-box" };
  return (
    <div style={{ position: "relative" }}>
      {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: T.faint, fontWeight: 700, pointerEvents: "none" }}>{prefix}</span>}
      <input inputMode={allowDecimal ? "decimal" : "numeric"} value={txt} placeholder={placeholder || ""} style={inp}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        onChange={(e) => { let raw = e.target.value.replace(/,/g, ""); raw = allowDecimal ? raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1") : raw.replace(/[^\d]/g, ""); setTxt(brFmtInput(raw, allowDecimal)); onChange(raw); }} />
      {suffix && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.faint, fontWeight: 600, pointerEvents: "none" }}>{suffix}</span>}
    </div>
  );
}

// ---- Result summary (sticky on desktop) ----
function SummaryCard({ title, rows, headline, warnings }) {
  return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 800, color: T.ink }}>{title}</div>
      <div style={{ height: 1, background: T.hair, margin: "10px 0 8px" }} />
      {rows.map((r, i) => r.divider ? <div key={i} style={{ height: 1, background: T.hairSoft, margin: "8px 0" }} /> : (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", alignItems: "baseline" }}>
          <span style={{ fontSize: r.strong ? 12.5 : 12, color: r.strong ? T.ink : T.muted, fontWeight: r.strong ? 700 : 500 }}>{r.label}</span>
          <span style={{ fontSize: r.strong ? 13 : 12.5, color: r.accent || T.ink, fontWeight: r.strong ? 800 : 600, whiteSpace: "nowrap" }}>{r.value}</span>
        </div>))}
      {headline && <div style={{ marginTop: 12, background: T.goldSoft, border: `1px solid ${T.gold}`, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{headline.label}</span>
        <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, color: T.gold, whiteSpace: "nowrap" }}>{headline.value}</span></div>}
      {warnings && warnings.length > 0 && <div style={{ marginTop: 10 }}>{warnings.map((w, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 11, color: T.warn, background: T.warnSoft, borderRadius: 8, padding: "7px 9px", marginTop: 6 }}><AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{w}</span></div>))}</div>}
    </div>
  );
}

// ---- Shared action bar: PDF download, preview modal, WhatsApp copy, reset ----
function BreakdownActions({ makeDoc, filename, waText, onReset }) {
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };
  const primaryBtn = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", background: T.gold, color: "#fff", fontWeight: 700, fontSize: 13, padding: "12px 14px", borderRadius: 10, cursor: "pointer", fontFamily: UI };
  const ghostBtn = { display: "flex", alignItems: "center", justifyContent: "center", gap: 7, border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontWeight: 600, fontSize: 12.5, padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontFamily: UI };
  const copy = async () => {
    try { await navigator.clipboard.writeText(waText); flash("WhatsApp summary copied"); }
    catch (e) { try { const ta = document.createElement("textarea"); ta.value = waText; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); flash("WhatsApp summary copied"); } catch (e2) { flash("Couldn't copy automatically"); } }
  };
  const download = async () => { setBusy(true); try { const [J, lh] = await Promise.all([loadJsPdf(), loadLetterhead()]); makeDoc(J, lh).save(filename); flash("PDF downloaded"); } catch (e) { flash("PDF failed — try again"); } setBusy(false); };
  const openPreview = async () => { setBusy(true); try { const [J, lh] = await Promise.all([loadJsPdf(), loadLetterhead()]); setPreview(makeDoc(J, lh).output("bloburl")); } catch (e) { flash("Preview failed"); } setBusy(false); };
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <button onClick={download} disabled={busy} style={{ ...primaryBtn, gridColumn: "1 / -1" }}><Download size={15} /> {busy ? "Working…" : "Download Client PDF"}</button>
        <button onClick={openPreview} disabled={busy} style={ghostBtn}><FileText size={14} /> Preview</button>
        <button onClick={copy} style={ghostBtn}><MessageCircle size={14} /> WhatsApp</button>
        <button onClick={onReset} style={{ ...ghostBtn, gridColumn: "1 / -1" }}><RotateCcw size={14} /> Reset calculator</button>
      </div>
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", padding: "11px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: T.shadowLg }}>{toast}</div>}
      {preview && <div onClick={() => setPreview("")} style={{ position: "fixed", inset: 0, background: "rgba(8,4,18,.7)", zIndex: 300, display: "grid", placeItems: "center", padding: 16 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: T.paper, borderRadius: 14, width: "min(900px,96vw)", height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.hair}` }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: T.ink }}>PDF preview</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={download} style={{ ...miniBtn(), fontWeight: 700, color: T.gold, borderColor: T.gold }}>Download</button>
              <button onClick={() => setPreview("")} style={miniBtn()}>Close</button>
            </div>
          </div>
          <iframe title="PDF preview" src={preview} style={{ flex: 1, border: "none", width: "100%" }} />
        </div>
      </div>}
    </>
  );
}

const BRK_PROP_TYPES = ["", "Apartment", "Villa", "Townhouse", "Penthouse", "Plot / Land", "Office", "Other"];
const BRK_BEDS = ["", "Studio", "1", "2", "3", "4", "5", "6+"];
const BRK_MORTGAGE = ["Cash Buyer", "Mortgage Buyer", "Seller Mortgage", "Buyer and Seller Both Mortgage"];
const INITIAL_OFFPLAN = { clientName: "", projectName: "", developerName: "", unitNumber: "", propertyType: "", location: "", bedrooms: "", sizeSqft: "", originalPrice: "", resalePrice: "", amountPaid: "", pctPaid: "", lastPaidEdit: "amount", premiumVal: "", nocRequiredPercent: "", nocPayer: "Buyer", buyerNocShare: "", sellerNocShare: "", nocNotes: "", dldPct: "4", agencyPct: "2", vatPct: "5", trustee: "4200", noc: "5250", saleProg: "1000", other: "", planBase: "", payments: [], expectedHandover: "", handoverPct: "", handoverAmount: "", finalDate: "", finalAmount: "", postHandover: "No", postHandoverDuration: "", paymentFrequency: "", postHandoverAmount: "" };
const INITIAL_READY = { clientName: "", propertyName: "", unitNumber: "", propertyType: "", location: "", bedrooms: "", sizeSqft: "", mortgageStatus: "Cash Buyer", sellingPrice: "", dldPct: "4", agencyPct: "2", vatPct: "5", trustee: "4200", titleAdmin: "580", noc: "5000", mortgageRegPct: "0.25", mortgageAmount: "", mortgageRelease: "", other: "" };

// Shared field helpers used by both forms (called as functions -> stable, no focus loss)
function brLbl() { return { fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: T.muted, display: "block", marginBottom: 5 }; }
function brInp() { return { width: "100%", border: `1px solid ${T.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: UI, outline: "none", color: T.ink, background: T.paper, boxSizing: "border-box" }; }
function brSection(title, children) {
  return <div style={{ ...card, padding: 16, marginBottom: 14 }}>
    <div style={{ fontFamily: DISPLAY, fontSize: 13.5, fontWeight: 800, color: T.ink, marginBottom: 12 }}>{title}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12 }}>{children}</div>
  </div>;
}

// One editable developer-payment row (module-level -> stable identity, no focus loss).
function PaymentRowEditor({ row, base, isNext, onChange, onRemove }) {
  const lbl = brLbl(), inp = brInp();
  const amtVal = (row.lastEdit === "pct" && base > 0 && row.pct !== "" && row.pct != null) ? String(Math.round(base * brN(row.pct) / 100)) : row.amount;
  const pctVal = (row.lastEdit === "amount" && base > 0 && row.amount !== "" && row.amount != null) ? (brN(row.amount) / base * 100).toFixed(2).replace(/\.?0+$/, "") : row.pct;
  return (
    <div style={{ border: `1px solid ${isNext ? T.gold : T.hairSoft}`, background: isNext ? T.goldSoft : T.bone, borderRadius: 12, padding: 12, position: "relative" }}>
      {isNext && <div style={{ position: "absolute", top: -9, left: 12, background: T.gold, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, letterSpacing: ".04em" }}>NEXT</div>}
      <button onClick={onRemove} title="Remove payment" style={{ position: "absolute", top: 8, right: 8, border: "none", background: "transparent", color: T.faint, cursor: "pointer", padding: 4 }}><Trash2 size={14} /></button>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 10 }}>
        <div style={{ gridColumn: "1 / -1", maxWidth: 380 }}><label style={lbl}>Payment label</label><input value={row.label} placeholder="e.g. Handover Payment" onChange={(e) => onChange({ label: e.target.value })} style={inp} /></div>
        <div><label style={lbl}>Due date</label><input type="date" value={row.dueDate} onChange={(e) => onChange({ dueDate: e.target.value })} style={{ ...inp, cursor: "pointer" }} /></div>
        <div><label style={lbl}>Percentage</label><BrNum value={pctVal} onChange={(v) => onChange({ pct: v, lastEdit: "pct" })} allowDecimal suffix="%" /></div>
        <div><label style={lbl}>Amount</label><BrNum value={amtVal} onChange={(v) => onChange({ amount: v, lastEdit: "amount" })} prefix="AED" /></div>
        <div><label style={lbl}>Status</label><select value={row.status} onChange={(e) => onChange({ status: e.target.value })} style={{ ...inp, cursor: "pointer" }}>{BRK_PAY_STATUS.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
        <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Notes</label><input value={row.notes} placeholder="optional" onChange={(e) => onChange({ notes: e.target.value })} style={inp} /></div>
      </div>
    </div>
  );
}

function OffPlanCalc({ user, narrow }) {
  const [f, setF] = useState(INITIAL_OFFPLAN);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const r = calcOffPlan(f);
  const lbl = brLbl(), inp = brInp();
  const amtVal = f.lastPaidEdit === "pct" ? (brN(f.originalPrice) > 0 ? String(Math.round(brN(f.originalPrice) * brN(f.pctPaid) / 100)) : "") : f.amountPaid;
  const pctVal = f.lastPaidEdit === "amount" ? (brN(f.originalPrice) > 0 ? (brN(f.amountPaid) / brN(f.originalPrice) * 100).toFixed(2).replace(/\.?0+$/, "") : "") : f.pctPaid;
  const txt = (label, k, ph, req) => <div key={k}><label style={lbl}>{label}{req ? <span style={{ color: T.bad }}> *</span> : null}</label><input value={f[k]} placeholder={ph || ""} onChange={(e) => set(k, e.target.value)} style={inp} /></div>;
  const sel = (label, k, opts) => <div key={k}><label style={lbl}>{label}</label><select value={f[k]} onChange={(e) => set(k, e.target.value)} style={{ ...inp, cursor: "pointer" }}>{opts.map((o) => <option key={o} value={o}>{o === "" ? "Select…" : o}</option>)}</select></div>;
  const num = (label, o) => <div key={o.k || label}><label style={lbl}>{label}{o.req ? <span style={{ color: T.bad }}> *</span> : null}</label><BrNum value={o.value !== undefined ? o.value : f[o.k]} onChange={o.onChange || ((v) => set(o.k, v))} allowDecimal={o.dec} prefix={o.prefix} suffix={o.suffix} placeholder={o.ph} invalid={o.invalid} />{o.hint ? <div style={{ fontSize: 10.5, color: T.faint, marginTop: 3 }}>{o.hint}</div> : null}</div>;
  const ro = (label, value, accent) => <div key={label}><label style={lbl}>{label}</label><div style={{ ...inp, background: T.bone, fontWeight: 700, color: accent || T.ink, display: "flex", alignItems: "center", minHeight: 41 }}>{value}</div></div>;
  const dateF = (label, k) => <div key={k}><label style={lbl}>{label}</label><input type="date" value={f[k]} onChange={(e) => set(k, e.target.value)} style={{ ...inp, cursor: "pointer" }} /></div>;
  const planBaseNum = planBaseOf(f);
  const fut = calcFuture(f, r);
  const addPayment = () => setF((p) => ({ ...p, payments: [...p.payments, { id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), label: "", dueDate: "", pct: "", amount: "", lastEdit: "amount", status: "Upcoming", notes: "" }] }));
  const removePayment = (id) => setF((p) => ({ ...p, payments: p.payments.filter((x) => x.id !== id) }));
  const updatePayment = (id, patch) => setF((p) => ({ ...p, payments: p.payments.map((x) => x.id === id ? { ...x, ...patch } : x) }));
  const autoCalcPayments = () => setF((p) => { const base = planBaseOf(p); return { ...p, payments: p.payments.map((x) => (x.pct !== "" && x.pct != null && base > 0) ? { ...x, amount: String(Math.round(base * brN(x.pct) / 100)), lastEdit: "amount" } : x) }; });
  const futureRows = [
    ...(r.hasNoc ? [{ label: "Total paid before transfer", value: brAed(r.amountPaid + r.additionalForNoc) }] : []),
    { label: "Remaining developer balance / future plan", value: brAed(fut.remainingToDev), strong: true },
    { label: "Total scheduled future", value: brAed(fut.totalScheduled) },
    { label: "Balance not scheduled", value: (fut.balanceNotScheduled < 0 ? "\u2212 " : "") + brAed(Math.abs(fut.balanceNotScheduled)), accent: fut.rows.length ? (fut.matched ? T.ok : T.bad) : T.muted },
    ...(fut.rows.length ? [{ label: "Schedule status", value: fut.matched ? "Matches" : "Review plan", accent: fut.matched ? T.ok : T.bad, strong: true }] : []),
    ...(fut.next ? [{ divider: true }, { label: "Next payment", value: brAed(fut.next.amt) + (fut.next.dueDate ? " \u00b7 " + brDate(fut.next.dueDate) : "") }] : []),
    ...((f.payments.length === 0 && (f.expectedHandover || brN(f.handoverAmount) > 0)) ? [{ label: "Handover", value: [brN(f.handoverAmount) > 0 ? brAed(f.handoverAmount) : "", f.expectedHandover ? brDate(f.expectedHandover) : ""].filter(Boolean).join(" \u00b7 ") || "\u2014" }] : []),
    ...((f.payments.length === 0 && (f.finalDate || brN(f.finalAmount) > 0)) ? [{ label: "Final payment", value: [brN(f.finalAmount) > 0 ? brAed(f.finalAmount) : "", f.finalDate ? brDate(f.finalDate) : ""].filter(Boolean).join(" \u00b7 ") || "\u2014" }] : []),
  ];
  const futureWarn = (fut.rows.length && !fut.matched) ? ["The future payment schedule does not match the remaining developer balance. Please review the payment plan."] : [];
  const warns = [];
  if (brN(amtVal) > brN(f.originalPrice) && brN(f.originalPrice) > 0) warns.push("Amount paid is more than the original purchase price.");
  if (r.pctPaid > 100) warns.push("Percentage paid is over 100%.");
  if (brN(f.resalePrice) > 0 && brN(f.originalPrice) > 0 && r.isDiscount) warns.push("Resale price is below the original price — shown as a discount.");
  if (r.hasNoc && r.nocReqPct > 100) warns.push("NOC required percentage is over 100% of the original price.");
  if (r.hasNoc && r.nocPayer === "Custom split" && r.additionalForNoc > 0 && Math.abs((brN(f.buyerNocShare) + brN(f.sellerNocShare)) - r.additionalForNoc) >= 1) warns.push("Buyer + seller NOC contributions must add up to " + brAed(r.additionalForNoc) + ".");
  const rows = [
    { label: "Resale selling price", value: brAed(r.resalePrice) },
    { label: "Amount paid to developer", value: brAed(r.amountPaid) + " (" + r.pctPaid.toFixed(1) + "%)" },
    ...(r.hasNoc ? [
      { label: "Required for NOC (" + r.nocReqPct + "%)", value: brAed(r.nocRequiredAmount) },
      { label: "Additional needed for NOC", value: brAed(r.additionalForNoc), accent: r.additionalForNoc > 0 ? T.bad : T.ok },
    ] : []),
    { label: r.isDiscount ? "Seller discount" : "Seller premium", value: (r.isDiscount ? "\u2212 " : "") + brAed(Math.abs(r.premium)), accent: r.isDiscount ? T.bad : T.ok },
    { label: "Payable to seller now", value: brAed(r.payableToSeller), strong: true },
    ...(r.hasNoc && r.payableToDevBeforeNoc > 0 ? [{ label: "Payable to developer (NOC)", value: brAed(r.payableToDevBeforeNoc) }] : []),
    { divider: true },
    { label: "DLD fee", value: brAed(r.dld) },
    { label: "Agency commission + VAT", value: brAed(r.agencyVat) },
    { label: "Trustee fee", value: brAed(r.trustee) },
    { label: "NOC / admin fee", value: brAed(r.noc) },
    { label: "Sale progression", value: brAed(r.saleProg) },
    ...(r.other > 0 ? [{ label: "Other charges", value: brAed(r.other) }] : []),
    { label: "Total buying costs", value: brAed(r.totalBuying), strong: true },
    { divider: true },
    { label: r.hasNoc ? "Remaining developer balance / future plan" : "Remaining to developer", value: brAed(r.remainingAfterNoc) },
    { label: "Total cost (excl. buying)", value: brAed(r.totalExcl) },
    { label: "Total cost (incl. buying)", value: brAed(r.totalIncl), strong: true },
  ];
  return (
    <div style={{ display: narrow ? "block" : "grid", gridTemplateColumns: narrow ? undefined : "minmax(0,1fr) 360px", gap: 18, alignItems: "start" }}>
      <div>
        {brSection("Property details", [
          txt("Client name", "clientName", "e.g. Mr. Ahmed", true), txt("Project name", "projectName"), txt("Developer name", "developerName"),
          txt("Unit number", "unitNumber"), sel("Property type", "propertyType", BRK_PROP_TYPES), txt("Location / community", "location"),
          sel("Bedrooms", "bedrooms", BRK_BEDS), num("Size (sq ft)", { k: "sizeSqft", dec: true, suffix: "ft²" }),
        ])}
        {brSection("Financial inputs", [
          num("Original purchase price", { k: "originalPrice", prefix: "AED", req: true }),
          num("Resale selling price", { k: "resalePrice", prefix: "AED", req: true }),
          num("Amount paid to developer", { k: "amountPaid", prefix: "AED", value: amtVal, onChange: (v) => setF((p) => ({ ...p, amountPaid: v, lastPaidEdit: "amount" })), invalid: brN(amtVal) > brN(f.originalPrice) && brN(f.originalPrice) > 0 }),
          num("Percentage paid", { k: "pctPaid", dec: true, suffix: "%", value: pctVal, onChange: (v) => setF((p) => ({ ...p, pctPaid: v, lastPaidEdit: "pct" })) }),
          ro("Remaining to developer", brAed(r.remainingToDev)),
          ro("Seller " + (r.isDiscount ? "discount" : "premium"), (r.isDiscount ? "\u2212 " : "") + brAed(Math.abs(r.premium)), r.isDiscount ? T.bad : T.ok),
          num("Override premium (optional)", { k: "premiumVal", prefix: "AED", ph: r.resalePrice || r.originalPrice ? String(Math.round(r.autoPremium)) : "" }),
          ro("Total payable to seller now", brAed(r.payableToSeller), T.gold),
        ])}
        {brSection("Developer NOC requirement", [
          num("Minimum payment for NOC", { k: "nocRequiredPercent", dec: true, suffix: "%", hint: r.hasNoc ? "= " + brAed(r.nocRequiredAmount) : "developer's minimum to issue NOC, e.g. 30 / 40 / 50" }),
          ro("Required NOC amount", brAed(r.nocRequiredAmount)),
          ro("Additional needed for NOC", brAed(r.additionalForNoc), r.additionalForNoc > 0 ? T.bad : T.ok),
          sel("Who pays the NOC shortfall", "nocPayer", ["Buyer", "Seller", "Custom split"]),
          ...(f.nocPayer === "Custom split" ? [
            num("Buyer NOC contribution", { k: "buyerNocShare", prefix: "AED" }),
            num("Seller NOC contribution", { k: "sellerNocShare", prefix: "AED" }),
          ] : []),
          txt("NOC shortfall notes", "nocNotes", "optional"),
        ])}
        {r.hasNoc ? <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 13px", borderRadius: 10, marginTop: -4, marginBottom: 14, background: r.nocMet ? T.okSoft : T.warnSoft, border: `1px solid ${(r.nocMet ? T.ok : T.warn)}33` }}><span style={{ fontSize: 12.5, fontWeight: 600, color: r.nocMet ? T.ok : T.warn, lineHeight: 1.4 }}>{r.nocMet ? "Seller has already paid enough to apply for developer NOC." : "Additional payment of " + brAed(r.additionalForNoc) + " is required before developer NOC can be issued."}</span></div> : null}
        {brSection("Transfer & buying costs", [
          num("DLD fee", { k: "dldPct", dec: true, suffix: "%", hint: "= " + brAed(r.dld) }),
          num("Agency commission", { k: "agencyPct", dec: true, suffix: "%", hint: "= " + brAed(r.agency) }),
          num("VAT on commission", { k: "vatPct", dec: true, suffix: "%", hint: "= " + brAed(r.vat) }),
          num("Trustee fee", { k: "trustee", prefix: "AED" }),
          num("Developer NOC / admin fee", { k: "noc", prefix: "AED" }),
          num("Sale progression fee", { k: "saleProg", prefix: "AED" }),
          num("Other admin charges", { k: "other", prefix: "AED" }),
        ])}
        <div style={{ ...card, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div><div style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 800, color: T.ink }}>Future payment plan</div><div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>Upcoming developer payments after transfer</div></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={autoCalcPayments} style={{ border: `1px solid ${T.hair}`, background: T.paper, color: T.ink, fontWeight: 600, fontSize: 12, padding: "8px 12px", borderRadius: 9, cursor: "pointer", fontFamily: UI }}>Auto-calculate amounts</button>
              <button onClick={addPayment} style={{ border: "none", background: T.gold, color: "#fff", fontWeight: 700, fontSize: 12, padding: "8px 14px", borderRadius: 9, cursor: "pointer", fontFamily: UI, display: "flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Add payment</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: f.payments.length ? 14 : 6 }}>
            {num("Payment plan base", { k: "planBase", prefix: "AED", ph: brN(f.originalPrice) > 0 ? brNum(f.originalPrice) : "Original purchase price", hint: "Defaults to the original purchase price" })}
          </div>
          {f.payments.length === 0
            ? <div style={{ fontSize: 12, color: T.muted, textAlign: "center", padding: "12px 0 4px", border: `1px dashed ${T.hair}`, borderRadius: 10 }}>No future payments yet — tap “Add payment” to build the developer schedule.</div>
            : <div style={{ display: "grid", gap: 12 }}>{f.payments.map((p) => <PaymentRowEditor key={p.id} row={p} base={planBaseNum} isNext={!!(fut.next && fut.next.id === p.id)} onChange={(patch) => updatePayment(p.id, patch)} onRemove={() => removePayment(p.id)} />)}</div>}
        </div>
        {f.payments.length === 0 ? brSection("Handover & final payment", [
          dateF("Expected handover date", "expectedHandover"),
          num("Handover payment %", { k: "handoverPct", dec: true, suffix: "%" }),
          num("Handover payment amount", { k: "handoverAmount", prefix: "AED" }),
          dateF("Final payment date", "finalDate"),
          num("Final payment amount", { k: "finalAmount", prefix: "AED" }),
          sel("Post-handover plan", "postHandover", ["No", "Yes"]),
          ...(f.postHandover === "Yes" ? [
            sel("Post-handover duration", "postHandoverDuration", ["", "12 months", "24 months", "36 months", "Custom"]),
            sel("Payment frequency", "paymentFrequency", ["", "Monthly", "Quarterly", "Semi-Annually", "Yearly", "Custom"]),
            num("Post-handover amount", { k: "postHandoverAmount", prefix: "AED" }),
          ] : []),
        ]) : <div style={{ fontSize: 11.5, color: T.faint, marginTop: -2, marginBottom: 14, paddingLeft: 2 }}>Handover and final payments are part of the payment plan above — set a row’s status to <b style={{ color: T.muted }}>On Handover</b> or <b style={{ color: T.muted }}>Final Payment</b>.</div>}
      </div>
      <div style={{ position: narrow ? "static" : "sticky", top: 16 }}>
        <SummaryCard title="Off-plan resale summary" rows={rows} headline={{ label: "Buyer immediate cash", value: brAed(r.immediateCash) }} warnings={warns} />
        <div style={{ height: 12 }} />
        <SummaryCard title="Future developer payments" rows={futureRows} warnings={futureWarn} />
        <BreakdownActions makeDoc={(J, lh) => buildBreakdownDoc(J, "offplan", f, r, user, lh, fut)} filename={"Amber-Homes-Off-Plan-Resale-Breakdown-" + brSafeName(f.clientName) + ".pdf"} waText={waOffPlan(f, r, fut)} onReset={() => setF(INITIAL_OFFPLAN)} />
      </div>
    </div>
  );
}

function ReadyCalc({ user, narrow }) {
  const [f, setF] = useState(INITIAL_READY);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const r = calcReady(f);
  const lbl = brLbl(), inp = brInp();
  const txt = (label, k, ph, req) => <div key={k}><label style={lbl}>{label}{req ? <span style={{ color: T.bad }}> *</span> : null}</label><input value={f[k]} placeholder={ph || ""} onChange={(e) => set(k, e.target.value)} style={inp} /></div>;
  const sel = (label, k, opts) => <div key={k}><label style={lbl}>{label}</label><select value={f[k]} onChange={(e) => set(k, e.target.value)} style={{ ...inp, cursor: "pointer" }}>{opts.map((o) => <option key={o} value={o}>{o === "" ? "Select…" : o}</option>)}</select></div>;
  const num = (label, o) => <div key={o.k || label}><label style={lbl}>{label}{o.req ? <span style={{ color: T.bad }}> *</span> : null}</label><BrNum value={f[o.k]} onChange={(v) => set(o.k, v)} allowDecimal={o.dec} prefix={o.prefix} suffix={o.suffix} placeholder={o.ph} />{o.hint ? <div style={{ fontSize: 10.5, color: T.faint, marginTop: 3 }}>{o.hint}</div> : null}</div>;
  const finFields = [
    num("Selling price", { k: "sellingPrice", prefix: "AED", req: true }),
    num("DLD fee", { k: "dldPct", dec: true, suffix: "%", hint: "= " + brAed(r.dld) }),
    num("Agency commission", { k: "agencyPct", dec: true, suffix: "%", hint: "= " + brAed(r.agency) }),
    num("VAT on commission", { k: "vatPct", dec: true, suffix: "%", hint: "= " + brAed(r.vat) }),
    num("Trustee fee", { k: "trustee", prefix: "AED" }),
    num("Title deed / map / admin fee", { k: "titleAdmin", prefix: "AED" }),
    num("Developer NOC fee", { k: "noc", prefix: "AED" }),
  ];
  if (r.buyerMortgage) { finFields.push(num("Mortgage amount", { k: "mortgageAmount", prefix: "AED" })); finFields.push(num("Mortgage registration", { k: "mortgageRegPct", dec: true, suffix: "%", hint: "= " + brAed(r.mortgageReg) })); }
  if (r.sellerMortgage) finFields.push(num("Mortgage release / blocking", { k: "mortgageRelease", prefix: "AED" }));
  finFields.push(num("Other charges", { k: "other", prefix: "AED" }));
  const rows = [
    { label: "Selling price", value: brAed(r.sellingPrice), strong: true },
    { divider: true },
    { label: "DLD fee", value: brAed(r.dld) },
    { label: "Agency commission + VAT", value: brAed(r.agencyVat) },
    { label: "Trustee fee", value: brAed(r.trustee) },
    { label: "Title / map / admin", value: brAed(r.titleAdmin) },
    { label: "Developer NOC", value: brAed(r.noc) },
    ...(r.buyerMortgage ? [{ label: "Mortgage registration", value: brAed(r.mortgageReg) }] : []),
    ...(r.sellerMortgage && r.mortgageRelease > 0 ? [{ label: "Mortgage release / blocking", value: brAed(r.mortgageRelease) }] : []),
    ...(r.other > 0 ? [{ label: "Other charges", value: brAed(r.other) }] : []),
    { label: "Total buying costs", value: brAed(r.totalBuying), strong: true },
  ];
  return (
    <div style={{ display: narrow ? "block" : "grid", gridTemplateColumns: narrow ? undefined : "minmax(0,1fr) 360px", gap: 18, alignItems: "start" }}>
      <div>
        {brSection("Property details", [
          txt("Client name", "clientName", "e.g. Mr. Ahmed", true), txt("Property / building name", "propertyName"), txt("Unit number", "unitNumber"),
          sel("Property type", "propertyType", BRK_PROP_TYPES), txt("Location / community", "location"), sel("Bedrooms", "bedrooms", BRK_BEDS),
          num("Size (sq ft)", { k: "sizeSqft", dec: true, suffix: "ft²" }), sel("Mortgage status", "mortgageStatus", BRK_MORTGAGE),
        ])}
        {brSection("Financial inputs", finFields)}
      </div>
      <div style={{ position: narrow ? "static" : "sticky", top: 16 }}>
        <SummaryCard title="Ready resale summary" rows={rows} headline={{ label: "Total buyer cash requirement", value: brAed(r.totalCash) }} warnings={[]} />
        <BreakdownActions makeDoc={(J, lh) => buildBreakdownDoc(J, "ready", f, r, user, lh, null)} filename={"Amber-Homes-Ready-Resale-Breakdown-" + brSafeName(f.clientName) + ".pdf"} waText={waReady(f, r)} onReset={() => setF(INITIAL_READY)} />
      </div>
    </div>
  );
}

function BreakdownCalculator({ user, narrow }) {
  const [mode, setMode] = useState("offplan");
  useEffect(() => { loadJsPdf(); loadLetterhead(); }, []);
  const cards = [
    { id: "offplan", title: "Off-Plan Resale", desc: "Calculate paid amount, premium, remaining developer payment plan, transfer costs and buyer cash requirement.", Icon: Building2 },
    { id: "ready", title: "Ready Property Resale", desc: "Calculate full ready-property resale costs including DLD, commission, trustee, NOC and admin charges.", Icon: Home },
  ];
  return (
    <div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Create client-ready Dubai property resale cost breakdowns in seconds.</div>
      <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {cards.map((c) => { const on = mode === c.id; return (
          <button key={c.id} onClick={() => setMode(c.id)} style={{ textAlign: "left", border: `1.5px solid ${on ? T.gold : T.hair}`, background: on ? T.goldSoft : T.paper, borderRadius: 14, padding: "16px 18px", cursor: "pointer", boxShadow: on ? T.shadow : "none", transition: "all .15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: on ? T.gold : T.bone, display: "grid", placeItems: "center" }}><c.Icon size={17} color={on ? "#fff" : T.muted} /></div>
              <div style={{ fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 800, color: T.ink }}>{c.title}</div>
              {on && <CheckCircle2 size={16} color={T.gold} style={{ marginLeft: "auto" }} />}
            </div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{c.desc}</div>
          </button>); })}
      </div>
      {mode === "offplan" ? <OffPlanCalc user={user} narrow={narrow} /> : <ReadyCalc user={user} narrow={narrow} />}
    </div>
  );
}

function PushSetup({ user }) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("enable"); // 'enable' | 'ios-install'
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) return;
    try { if (sessionStorage.getItem("amber_push_dismissed") === "1") return; } catch (e) {}
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) { if (isIosDevice() && !isStandalonePwa()) { setMode("ios-install"); setShow(true); } return; }
    if (Notification.permission === "granted") { ensurePushSubscribed().catch(() => {}); return; }
    if (Notification.permission === "denied") return;
    if (isIosDevice() && !isStandalonePwa()) { setMode("ios-install"); setShow(true); return; }
    setMode("enable"); setShow(true);
  }, [user]);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setBusy(false); if (perm === "denied") setShow(false); return; }
      await ensurePushSubscribed();
      setShow(false);
    } catch (e) { /* ignore */ }
    setBusy(false);
  };
  const dismiss = () => { try { sessionStorage.setItem("amber_push_dismissed", "1"); } catch (e) {} setShow(false); };

  if (!show) return null;
  return (
    <div style={{ position: "fixed", left: 12, right: 12, bottom: 84, zIndex: 60, maxWidth: 440, margin: "0 auto",
      background: T.paper, border: `1px solid ${T.hair}`, borderRadius: 14, padding: "12px 14px", boxShadow: T.shadow, fontFamily: UI }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: T.goldSoft, color: T.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Bell size={17} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>Get lead alerts on this phone</div>
          {mode === "enable"
            ? <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>Be notified the moment a lead is assigned to you.</div>
            : <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1, lineHeight: 1.45 }}>On iPhone: tap the Share icon, choose <b>Add to Home Screen</b>, then open Amber from that icon and turn alerts on.</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
        <button onClick={dismiss} style={{ background: "none", border: `1px solid ${T.hair}`, color: T.muted, borderRadius: 9, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>Not now</button>
        {mode === "enable" && <button onClick={enable} disabled={busy} style={{ background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: busy ? "default" : "pointer", fontFamily: UI, opacity: busy ? 0.7 : 1 }}>{busy ? "Enabling…" : "Turn on alerts"}</button>}
      </div>
    </div>
  );
}

function AskAmber({ narrow, user, openLead }) {
  const [open, setOpen] = useState(false);
  const [mentor, setMentor] = useState(null);     // chosen mentor object
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [kb, setKb] = useState([]);                // Amber Homes knowledge (loaded once per session)
  const [revealedAi, setRevealedAi] = useState({}); // { [leadId]: true } — gate WhatsApp/Call behind Reveal in chat cards
  const [leadInfo, setLeadInfo] = useState(null);   // { name } when a specific lead is open in chat (for context-aware quick actions)
  const [pendingLookup, setPendingLookup] = useState(null);   // client name to auto-look-up once a mentor is ready (from the lead-page button)
  const [fb, setFb] = useState({});                 // { [msgIndex]: 'up' | 'down' } — answer-quality feedback
  const boxRef = useRef(null);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs, busy]);

  const pick = async (m, leadCtx) => {
    setMentor(m);
    setMsgs([{ role: "assistant", text: m.greeting }]);
    setLeadInfo(leadCtx && leadCtx.client_name ? { name: leadCtx.client_name } : null);
    // Load this agent's saved conversation with THIS mentor (RLS keeps it private to them).
    try {
      const { data: hist } = await supabase.from("ai_messages")
        .select("role, content, sources").eq("mentor_id", m.id)
        .order("created_at", { ascending: true }).limit(200);
      if (Array.isArray(hist) && hist.length)
        setMsgs([{ role: "assistant", text: m.greeting }, ...hist.map((h) => ({ role: h.role, text: h.content, sources: h.sources || undefined }))]);
    } catch (e) { /* best-effort; fall back to the greeting only */ }
    setCtx(await buildCrmContext(user, leadCtx)); // fetch permitted CRM context once per session
    fetchKnowledge(user).then(setKb).catch(() => setKb([])); // verified company knowledge
  };
  const reset = () => { setMentor(null); setMsgs([]); setInput(""); setLeadInfo(null); };
  // Persist one chat message for this agent + mentor (fires async, best-effort; RLS ties each row to auth.uid()). Powers per-agent memory.
  const persist = (role, text, sources) => {
    if (!mentor || !text) return;
    (async () => { try { await supabase.from("ai_messages").insert({ mentor_id: mentor.id, role, content: String(text).slice(0, 8000), sources: sources && sources.length ? sources : null }); } catch (e) {} })();
  };
  // Start a brand-new conversation with the current mentor (clears their saved thread for this agent only).
  const newChat = async () => {
    if (!mentor) { reset(); return; }
    if (!window.confirm("Start a new chat with " + mentor.name + "? This clears your saved conversation with this mentor.")) return;
    try { await supabase.from("ai_messages").delete().eq("mentor_id", mentor.id); } catch (e) {}
    setMsgs([{ role: "assistant", text: mentor.greeting }]); setInput("");
  };
  useEffect(() => {
    const onOpen = async (e) => {
      const d = e && e.detail;
      setOpen(true);
      if (!mentor) pick(MENTORS[0], d && d.lead);
      else if (d && d.lead) { try { setCtx(await buildCrmContext(user, d.lead)); setLeadInfo(d.lead.client_name ? { name: d.lead.client_name, email: d.lead.email || null, lead: d.lead } : null); } catch (err) {} }
      if (d && d.prompt) setInput(d.prompt);
      if (d && d.lookup && d.lead && d.lead.client_name) { setLeadInfo({ name: d.lead.client_name, email: d.lead.email || null, lead: d.lead }); setPendingLookup(d.lead); }
    };
    window.addEventListener("amber-open", onOpen);
    return () => window.removeEventListener("amber-open", onOpen);
  }, [mentor]);

  const logLeadAction = (action, ld) => { try { logAi({ user, mentor, question: "[lead action: " + action + "] " + (ld.name || ld.id), responseSum: "lead_action:" + action, category: "crm", status: "success" }); } catch (e) {} };
  // Answer-quality feedback (👍/👎) → ai_feedback table. Append-only; powers the weekly review of what works.
  const sendFeedback = async (i, rating) => {
    if (fb[i]) return;
    setFb((p) => ({ ...p, [i]: rating }));
    try {
      const q = (i > 0 && msgs[i - 1] && msgs[i - 1].role === "user") ? msgs[i - 1].text : "";
      const a = (msgs[i] && msgs[i].text) || "";
      const { data: { user: au } } = await supabase.auth.getUser();
      await supabase.from("ai_feedback").insert({
        user_id: au ? au.id : null,
        mentor: mentor ? mentor.id : null,
        rating,
        question: String(q).slice(0, 2000),
        response_summary: String(a).slice(0, 4000),
      });
    } catch (e) { /* feedback is best-effort; never block the chat */ }
  };
  // Reveal a chat-card contact: log server-side (reveal_contact RPC, same as Lead Detail) then unlock WhatsApp/Call.
  const revealAi = async (ld) => {
    setRevealedAi((r) => ({ ...r, [ld.id]: true }));
    try { await supabase.rpc("reveal_contact", { p_lead_id: ld.id }); } catch (e) {}
    logLeadAction("contact_reveal", ld);
  };
  const draftFor = (ld) => {
    const bits = [];
    if (ld.project && ld.project !== "—") bits.push("interested in " + ld.project);
    if (ld.area && ld.area !== ld.project && ld.area !== "—") bits.push("area " + ld.area);
    if (ld.budget) bits.push("budget " + ld.budget);
    if (ld.temp && ld.temp !== "—") bits.push(String(ld.temp).toLowerCase() + " lead");
    const ctxLine = bits.length ? " (" + bits.join(", ") + ")" : "";
    const q = `Write a short, client-safe WhatsApp follow-up to my client ${ld.name || "the client"}${ctxLine}. One warm, professional paragraph, ready to copy. No guarantees of price, ROI, premium or appreciation. If a current focus launch fits their interest, lead with it and add "subject to developer confirmation". Output only the message.`;
    logLeadAction("draft_message", ld);
    send(q, true);   // forceModel: draft directly, never re-run lead matching
  };
  const ctxBitsFor = (ld) => {
    const bits = [];
    if (ld.project && ld.project !== "—") bits.push("interested in " + ld.project);
    if (ld.area && ld.area !== ld.project && ld.area !== "—") bits.push("area " + ld.area);
    if (ld.budget) bits.push("budget " + ld.budget);
    if (ld.temp && ld.temp !== "—") bits.push(String(ld.temp).toLowerCase() + " lead");
    return bits.length ? " (" + bits.join(", ") + ")" : "";
  };
  const draftEmailFor = (ld) => {
    const q = `Write a short, professional, client-safe EMAIL to my client ${ld.name || "the client"}${ctxBitsFor(ld)}. Start with "Subject:" then the body: a warm greeting, 2-3 concise sentences on the opportunity, and a clear call to action to schedule a quick call. No guarantees of price, ROI, premium, appreciation, rental income or Golden Visa. Use "subject to availability / developer confirmation" where relevant. Output only the email.`;
    logLeadAction("draft_email", ld);
    send(q, true);
  };
  const scheduleFollowupFor = (ld) => { logLeadAction("schedule_followup", ld); if (openLead) { openLead(ld.id); setOpen(false); } };
  const send = async (q, forceModel, lookup, lookupLead) => {
    const text = (q != null ? q : input).trim();
    if (!text || busy || !mentor) return;
    setInput("");
    persist("user", text);
    // Pure courtesy/greeting → friendly in-persona reply, no model call, never flagged or refused.
    if (isPureGreeting(text)) {
      const courtesy = { ambreen_ai: "Doing great — now tell me which client we're converting today? Send me a lead, objection, project or follow-up and I'll help you handle it.",
        saad_ai: "I'm ready. Share the lead, project or client situation and I'll give you the best next move.",
        ibrahim_ai: "All good — let's make your day productive. Which lead or project are we working on?" }[mentor.id] || "Ready to help — send me a lead, client, project or follow-up.";
      setMsgs((m) => [...m, { role: "user", text }, { role: "assistant", text: courtesy }]);
      persist("assistant", courtesy);
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
      persist("assistant", refusal);
      logAi({ user, mentor, question: text, responseSum: "[refused: " + cat + "]", status: "refused", flagCategory: cat });
      return;
    }
    // CRM lead-list question → answer with actionable lead cards (RLS limits to permitted leads).
    const li = (forceModel || lookup) ? null : leadIntent(text, user && user.role);
    if (li) { const lt = parseLeadType(text); if (lt) li.leadType = lt; }
    if (li) {
      setMsgs((m) => [...m, { role: "user", text }]); setBusy(true);
      try {
        const out = await runLeadQuery(li, user);
        setMsgs((m) => [...m, { role: "assistant", text: out.heading, leads: out.leads }]);
        persist("assistant", out.heading);
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
      const res = await callAi({ mentor: mentor.id, crmContext: ctx, knowledge: picked.text, role: user && user.role, clientLookup: lookup || undefined, lookupLead: lookupLead || undefined,
          messages: next.slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })) });
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
        persist("assistant", reply || "Please try again.", sources);
        logAi({ user, mentor, question: text, responseSum: reply, fullResponse: reply, category: categorize(text), model: data.model, status: "success", tokensIn: data.usage && data.usage.input_tokens, tokensOut: data.usage && data.usage.output_tokens });
        if (data.web_enabled) { try { supabase.from("ai_web_log").insert({ user_id: user.id, user_name: user.name, user_role: user.role, query: String(text).slice(0, 500), used: webUsed, domains: data.web_domains || 0 }); } catch (e) {} }
      }
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: "Ask Amber is temporarily unavailable. Please try again." }]);
      logAi({ user, mentor, question: text, status: "error" });
    } finally { setBusy(false); }
  };

  const lookupMessageFor = (ld) => {
    const nm = ld.client_name || ld.name || "this lead";
    const em = ld.email || "";
    return em
      ? `Research ${nm} before I call — use their email (${em}) and its domain for an accurate match, not the name alone. Give me a confidence-scored result and don't guess.`
      : `Research ${nm} before I call. List the possible public matches so I can verify which one is my client — give a confidence level and don't guess.`;
  };
  const runLookup = (ld) => {
    if (!ld || busy || !mentor) return;
    const nm = ld.client_name || ld.name;
    logLeadAction("client_lookup", { id: nm, name: nm });
    const lookupLead = { name: nm, email: ld.email || null, nationality: ld.nationality || null, residence: ld.country_residence || ld.residence || null };
    send(lookupMessageFor(ld), true, true, lookupLead);
  };
  useEffect(() => { if (pendingLookup && mentor && !busy) { const ld = pendingLookup; setPendingLookup(null); runLookup(ld); } }, [pendingLookup, mentor, busy]); // eslint-disable-line

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
      <div className={narrow ? "amber-chat-header" : undefined} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: T.hero }}>
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
          <button onClick={() => setOpen(false)} title="Minimize — keep this chat" style={hdrBtn()}><ChevronDown size={16} color="#fff" /></button>
          <button onClick={() => { setOpen(false); reset(); }} title="Close — end chat" style={hdrBtn()}><X size={15} color="#fff" /></button>
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
                borderRadius: 13, padding: "9px 12px", fontSize: 12.8, lineHeight: 1.55, whiteSpace: m.role === "user" ? "pre-wrap" : "normal",
                overflowWrap: "anywhere", wordBreak: "break-word",
                boxShadow: m.role === "user" ? "none" : T.shadow }}>{m.role === "user" ? m.text : <RichText text={m.text} />}</div>
              {m.role !== "user" && m.text && i > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 4, marginLeft: 2 }}>
                  {!fb[i] ? (<>
                    <button onClick={() => sendFeedback(i, "up")} title="Helpful" style={{ background: "none", border: `1px solid ${T.hair}`, borderRadius: 7, padding: "3px 7px", cursor: "pointer", color: T.muted, display: "inline-flex", alignItems: "center" }}><ThumbsUp size={12} /></button>
                    <button onClick={() => sendFeedback(i, "down")} title="Not helpful" style={{ background: "none", border: `1px solid ${T.hair}`, borderRadius: 7, padding: "3px 7px", cursor: "pointer", color: T.muted, display: "inline-flex", alignItems: "center" }}><ThumbsDown size={12} /></button>
                  </>) : (
                    <span style={{ fontSize: 10.5, color: T.faint }}>{fb[i] === "up" ? "Thanks for the feedback" : "Thanks — noted for improvement"}</span>
                  )}
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
                          <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                            {typeof ld.score === "number" && <span title="Lead score (0-100)" style={{ fontSize: 10, fontWeight: 800, background: ld.score >= 75 ? T.okSoft : ld.score >= 55 ? T.goldSoft : T.bone, color: ld.score >= 75 ? T.ok : ld.score >= 55 ? T.gold : T.muted, borderRadius: 6, padding: "1px 6px" }}>★ {ld.score}</span>}
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: tcol }}>{ld.temp}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{ld.project} · {ld.status}{ld.budget ? " · " + ld.budget : ""} · {ld.due}</div>
                        {ld.area && ld.area !== "—" && ld.area !== ld.project && <div style={{ fontSize: 10.5, color: T.faint, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={10} /> {ld.area}</div>}
                        {ld.match && <div style={{ fontSize: 10.5, fontWeight: 700, color: T.gold, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Sparkle size={11} /> Pitch: {ld.match}</div>}
                        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 3, lineHeight: 1.4 }}>{ld.reason}</div>
                        {ld.pitch && <div style={{ fontSize: 10.5, color: T.inkSoft, marginTop: 3, lineHeight: 1.4, background: T.bone, borderRadius: 8, padding: "5px 8px" }}>{ld.pitch}</div>}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          <button onClick={() => { logLeadAction("open", ld); if (openLead) { openLead(ld.id); setOpen(false); } }} style={cardBtn}>Open Lead</button>
                          {ph && !revealedAi[ld.id] && <button onClick={() => revealAi(ld)} title="Reveal contact" style={{ ...cardBtn, borderRadius: 999, borderColor: T.gold, color: T.gold }}><Eye size={11} /> Reveal</button>}
                          {ph && revealedAi[ld.id] && <button onClick={() => { logLeadAction("whatsapp", ld); window.open(waHref(ld.phone), "_blank"); }} style={{ ...cardBtn, borderColor: WA, color: WA }}><MessageCircle size={11} /> WhatsApp</button>}
                          {ph && revealedAi[ld.id] && <button onClick={() => { logLeadAction("call", ld); window.location.href = telHref(ld.phone); }} style={cardBtn}><Phone size={11} /> Call</button>}
                          <button onClick={() => draftFor(ld)} style={cardBtn}><MessageCircle size={11} /> Draft WhatsApp</button>
                          <button onClick={() => draftEmailFor(ld)} style={cardBtn}><Mail size={11} /> Draft email</button>
                          {openLead && <button onClick={() => scheduleFollowupFor(ld)} style={cardBtn}><Calendar size={11} /> Schedule follow-up</button>}
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
            {leadInfo && <button key="lookup" onClick={() => runLookup(leadInfo.lead || leadInfo)} style={{ border: `1px solid ${T.goldEdge}`, background: T.goldSoft, color: T.gold, borderRadius: 9, padding: "6px 11px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 5 }}><Search size={11} /> Look up {leadInfo.name} online</button>}
            {(leadInfo ? [`What should I do next with ${leadInfo.name}?`, `Profile ${leadInfo.name}`] : []).concat(["Compare two projects", "Analyze a client chat", "Practice a tough client", "What's launching soon?", "Match my leads to hot deals", "What should I focus on today?", "Show me my hot leads", "Draft a WhatsApp follow-up"]).map((s) => (
              <button key={s} onClick={() => send(s)} style={{ border: `1px solid ${T.goldEdge}`, background: T.goldSoft, color: T.gold,
                borderRadius: 9, padding: "6px 11px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>{s}</button>))}
          </div>
        )}
        <div className={narrow ? "amber-chat-foot" : undefined} style={{ display: "flex", gap: 8, padding: 11, borderTop: `1px solid ${T.hair}`, background: T.paper }}>
          <button onClick={newChat} title="New chat — clears this mentor's saved thread" style={{ ...miniBtn(), padding: "0 11px" }}>New</button>
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
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ action, ...body }) });
    return r.json();
  };
  const fetchProfileAndFinish = async (uid) => {
    const { data: prof } = await supabase.from("profiles").select("full_name, role, active, avatar_url").eq("id", uid).single();
    if (!prof) { setErr("No profile found for this account. Contact your admin."); setBusy(false); return; }
    if (prof.active === false) { await supabase.auth.signOut(); setErr("Your account is inactive. Please contact admin."); setBusy(false); return; }
    const role = resolveRole(email, prof.role);
    const ri = roleInfo(role); stampLogin(uid);
    onLogin({ name: prof.full_name || email, email, role, roleLabel: ri.label, home: ri.home, id: uid, avatar_url: prof.avatar_url || null, mustChangePw: false });
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
      const res = await api("start", { email: mail, password: pw, deviceId: getDeviceId(), trustToken: getTrustToken() });
      if (!res.ok) { setErr(friendly(res.reason)); setBusy(false); return; }
      if (res.needs2fa) { setStage("twofa"); setBusy(false); setResendIn(30); setCode(""); setNote("Enter the 4-digit code we emailed to " + mail + "."); return; }
      await establish(res.token_hash, res.mustChange);
    } catch (e) { setErr("Could not reach the server. Check your connection."); setBusy(false); }
  };
  const submitCode = async () => {
    setErr(""); if (!/^\d{4}$/.test(code.trim())) { setErr("Enter the 4-digit code from your email."); return; }
    setBusy(true);
    try {
      const res = await api("verify_2fa", { email, code: code.trim(), deviceId: getDeviceId() });
      if (!res.ok) { setErr(friendly(res.reason)); setBusy(false); if (res.reason === "locked" || res.reason === "expired") { setStage("creds"); setCode(""); setPw(""); } return; }
      if (res.trustToken) setTrustToken(res.trustToken);
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

// Remembers each leads view's filter/search/tab/sort/page across open-lead → back (resets on full reload).
const LEADS_VIEW_CACHE = {};
function LiveLeads({ user, filter, go, openLead, initialAgentFilter = null, heading = null, sub = null }) {
  const isAgent = user && user.role === "agent";
  const isMaster = user && user.role === "master_admin";
  const isOpsAdmin = user && user.role === "admin";   // operational Admin: may only see unassigned/open leads (for assignment)
  const viewKey = initialAgentFilter || "live";
  const _vc = (() => { try { const s = sessionStorage.getItem("amber_lv_" + viewKey); if (s) return JSON.parse(s); } catch (e) {} return LEADS_VIEW_CACHE[viewKey] || {}; })();
  const [leads, setLeads] = useState(null);   // null = loading; holds ONLY the current page
  const [err, setErr] = useState("");
  const [q, setQ] = useState(_vc.q || "");
  const [dq, setDq] = useState(_vc.dq || "");           // debounced search term (drives the DB query)
  const [tab, setTab] = useState(_vc.tab || "all");
  const [revealed, setRevealed] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [me, setMe] = useState(null);
  const [sort, setSort] = useState(_vc.sort || "newest");
  const [agentFilter, setAgentFilter] = useState(_vc.agentFilter !== undefined ? _vc.agentFilter : initialAgentFilter);   // null | 'unassigned' | 'open' | <agentId>
  const [typeFilter, setTypeFilter] = useState(_vc.typeFilter || "");                     // "" | Buyer | Seller | Tenant | Agent
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState({});            // { [leadId]: true } — current-page selection
  const [selectAllMatching, setSelectAllMatching] = useState(false);    // bulk over EVERY matching lead, not just the page
  const [showBulk, setShowBulk] = useState(false);
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(_vc.page || 0);        // 0-based page (server-side pagination)
  const [total, setTotal] = useState(0);      // total leads matching the current view
  const [tabCounts, setTabCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState([30, 50, 100].includes(_vc.pageSize) ? _vc.pageSize : 50);   // leads per page (adjustable)
  const [allIds, setAllIds] = useState([]);   // all matching lead IDs (id-only, loaded in background) so Prev/Next can span pages
  const [jumpVal, setJumpVal] = useState("");
  const PAGE = pageSize;
  const LEAD_COLS = "id,lead_code,client_name,phone,whatsapp,email,lead_type,project,area,budget,purpose,property_type,status,temperature,source,next_followup,last_contacted,is_open,assigned_agent,assigned_agent_name,current_owner,created_by,original_agent,created_at,created_on,deleted";
  const firstRun = useRef(true);
  useEffect(() => { const id = setTimeout(() => setDq(q), 350); return () => clearTimeout(id); }, [q]);              // debounce search 350ms
  useEffect(() => { if (firstRun.current) { firstRun.current = false; return; } setPage(0); setSelected({}); setSelectAllMatching(false); }, [dq, tab, agentFilter, typeFilter, sort, pageSize]); // real view change → page 1, clear selection (skip on mount/restore)
  useEffect(() => { setSelected({}); }, [page]);   // page-specific selection clears when paging
  useEffect(() => { const v = { q, dq, tab, sort, agentFilter, typeFilter, page, pageSize }; LEADS_VIEW_CACHE[viewKey] = v; try { sessionStorage.setItem("amber_lv_" + viewKey, JSON.stringify(v)); } catch (e) {} }, [viewKey, q, dq, tab, sort, agentFilter, typeFilter, page, pageSize]); // remember filters across open-lead → back (survives reload)
  const scrollRestored = useRef(false);
  const reqRef = useRef(0);   // ignore results from stale (superseded) loads
  const lastTabSig = useRef(null);   // recompute tab counts only when the filter set changes (not on page/sort)
  useEffect(() => { if (leads && !scrollRestored.current) { scrollRestored.current = true; let y = 0; try { y = parseInt(sessionStorage.getItem("amber_lvscroll_" + viewKey) || "0", 10); } catch (e) {} if (y > 0) { requestAnimationFrame(() => { try { window.scrollTo(0, y); } catch (e) {} }); try { sessionStorage.removeItem("amber_lvscroll_" + viewKey); } catch (e) {} } } }, [leads]); // restore scroll once when returning from a lead

  // Build the leads query with EVERY scope/permission rule + active filters applied AT THE DATABASE.
  // RLS independently enforces the same boundaries, so an agent can never receive another agent's leads.
  const applyFilters = (query, tabVal, uid) => {
    const tday = dubaiToday();
    const NOT_CLOSED = (qq) => qq.neq("status", "Closed Won").neq("status", "Closed Lost");
    // permission scope
    if (isAgent) {
      if (initialAgentFilter === "open") query = query.eq("is_open", true);
      else if (uid) query = query.or(`assigned_agent.eq.${uid},current_owner.eq.${uid},created_by.eq.${uid}`);
      else query = query.eq("id", "00000000-0000-0000-0000-000000000000");   // no session → match nothing
    } else if (isOpsAdmin) {
      query = query.or("is_open.eq.true,assigned_agent.is.null");            // ops-admin: unassigned + open only
    }
    // agent dropdown (non-agent)
    if (!isAgent && agentFilter) {
      if (agentFilter === "unassigned") query = query.is("assigned_agent", null).eq("is_open", false);
      else if (agentFilter === "open") query = query.eq("is_open", true);
      else query = query.eq("assigned_agent", agentFilter);
    }
    // entry filter prop (dashboard drill-downs)
    if (filter) {
      const v = filter.value;
      if (filter.type === "unassigned") query = query.is("assigned_agent_name", null);
      else if (filter.type === "temp") query = query.eq("temperature", v);
      else if (filter.type === "status") query = query.eq("status", v);
      else if (filter.type === "open") query = query.eq("is_open", true);
      else if (filter.type === "source") query = (v === "Unknown") ? query.or("source.is.null,source.eq.Unknown") : query.eq("source", v);
      else if (filter.type === "agent") query = (v === "Unassigned") ? query.is("assigned_agent_name", null) : query.eq("assigned_agent_name", v);
      else if (filter.type === "hot") query = query.in("temperature", ["Hot", "Very Hot"]);
      else if (filter.type === "due") query = NOT_CLOSED(query.not("next_followup", "is", null).lte("next_followup", tday));
      else if (filter.type === "overdue") query = NOT_CLOSED(query.not("next_followup", "is", null).lt("next_followup", tday));
    }
    // Rule: Agent-type leads must NEVER appear in the Open Leads pool — only client leads
    // (Buyer / Seller / Tenant, plus legacy blank-type) belong there. Excludes "Agent" while
    // keeping null/blank types visible (a plain .neq would also drop nulls).
    const openPoolView = initialAgentFilter === "open" || agentFilter === "open" || (filter && filter.type === "open");
    if (openPoolView) query = query.or("lead_type.is.null,lead_type.neq.Agent");
    // lead type (Buyer also matches legacy null type, to mirror the old default)
    if (typeFilter) query = (typeFilter === "Buyer") ? query.or("lead_type.eq.Buyer,lead_type.is.null") : query.eq("lead_type", typeFilter);
    // search (server-side ilike; sanitized so the or-filter can't be broken)
    if (dq.trim()) {
      const raw = dq.trim();
      const s = raw.replace(/[,()%*"\\]/g, " ").replace(/\s+/g, " ").trim();        // text-safe for the or-filter
      const core = raw.replace(/\D/g, "").replace(/^0+/, "");                       // phone digits, leading zeros dropped
      const ors = [];
      if (s) ors.push(`client_name.ilike.%${s}%`, `project.ilike.%${s}%`, `area.ilike.%${s}%`, `assigned_agent_name.ilike.%${s}%`, `lead_code.ilike.%${s}%`, `email.ilike.%${s}%`, `status.ilike.%${s}%`);
      if (core.length >= 4) ors.push(`normalized_phone.ilike.%${core}%`, `phone.ilike.%${core}%`, `whatsapp.ilike.%${core}%`);
      if (ors.length) query = query.or(ors.join(","));
    }
    // tab
    if (tabVal && tabVal !== "all") {
      if (tabVal === "Follow-up due") query = NOT_CLOSED(query.not("next_followup", "is", null).lte("next_followup", tday));
      else if (tabVal === "Overdue") query = NOT_CLOSED(query.not("next_followup", "is", null).lt("next_followup", tday));
      else if (tabVal === "Hot" || tabVal === "Very Hot" || tabVal === "Warm" || tabVal === "Cold") query = query.eq("temperature", tabVal);
      else query = query.eq("status", tabVal);
    }
    return query;
  };
  const SORT_COL = { newest: ["created_at", false], oldest: ["created_at", true], agent: ["assigned_agent_name", true], status: ["status", true], temp: ["temperature", true], source: ["source", true], project: ["project", true], area: ["area", true], lastcontact: ["last_contacted", false], nextfu: ["next_followup", true] };
  const load = async () => {
    const myReq = ++reqRef.current;
    setLoading(true); setErr(""); setAllIds([]);
    let au = me;
    if (!au) { try { const r = await supabase.auth.getUser(); au = r.data?.user; setMe(au); } catch (e) {} }
    const uid = au?.id;
    try {
      const sc = SORT_COL[sort] || SORT_COL.newest;
      const [rowsRes, tcRes] = await Promise.all([
        applyFilters(supabase.from("leads").select(LEAD_COLS), tab, uid).order(sc[0], { ascending: sc[1], nullsFirst: false }).range(page * PAGE, page * PAGE + PAGE - 1),
        applyFilters(supabase.from("leads").select("id", { count: "exact", head: true }), tab, uid),
      ]);
      if (myReq !== reqRef.current) return;          // a newer search started — drop this stale result
      if (rowsRes.error) throw rowsRes.error;
      const rows = rowsRes.data || [];
      setLeads(rows);
      setTotal(typeof tcRes.count === "number" ? tcRes.count : rows.length);
      setLoading(false);   // list + pagination interactive as soon as rows + total are in (tab badges fill in below)
      const tabSig = (dq || "") + "|" + (agentFilter || "") + "|" + (typeFilter || "") + "|" + (uid || "");
      if (tabSig !== lastTabSig.current) {
        lastTabSig.current = tabSig;
        (async () => { const counts = {}; await Promise.all(TABS.map(async (t) => {
          try { const r = await applyFilters(supabase.from("leads").select("id", { count: "exact", head: true }), t, uid); counts[t] = r.count ?? 0; } catch (e) { counts[t] = 0; }
        })); setTabCounts(counts); })();
      }
      // background: gather ALL matching IDs (id-only, light) so Prev/Next can step across page boundaries
      (async () => { try {
        const sc2 = SORT_COL[sort] || SORT_COL.newest;
        // One light request (first 1000 ids) so Prev/Next can step across the first pages without
        // paging the entire table on every load. Beyond that, navigation falls back to the page.
        const { data } = await applyFilters(supabase.from("leads").select("id"), tab, uid).order(sc2[0], { ascending: sc2[1], nullsFirst: false }).range(0, 999);
        setAllIds((data || []).map((r) => r.id));
      } catch (e) {} })();
    } catch (error) {
      if (myReq !== reqRef.current) return;          // stale failure — ignore so it can't blank a good list
      try { console.error("[Leads load failed]", { page, tab, uid, code: error.code, message: error.message, details: error.details, hint: error.hint, at: new Date().toISOString() }); } catch (e) {}
      // Non-destructive: keep whatever is already on screen and offer a retry instead of wiping to 0.
      setErr((leads && leads.length) ? "Couldn't refresh the list — showing the last results. Tap Retry." : "Lead search could not complete. Tap Retry.");
    }
    setLoading(false);
    if (!isAgent && agents.length === 0) {
      try { const { data: ag } = await supabase.from("profiles").select("id, full_name, role, active").order("full_name"); setAgents(ag || []); } catch (e) {}
    }
  };
  useEffect(() => { load(); }, [page, dq, tab, agentFilter, typeFilter, sort, pageSize]);   // eslint-disable-line

  const today = dubaiToday();
  const fmtDubai = (ts) => { if (!ts) return "—"; try { const s = new Date(ts).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }); return s.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase()); } catch (e) { return "—"; } };
  const fmtDay = (d) => { if (!d) return "—"; try { return new Date(d).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "short", year: "numeric" }); } catch (e) { return String(d); } };
  const agentName = (id) => { const a = agents.find((x) => x.id === id); return a ? a.full_name : null; };
  // Created By: real creator/importer name when recorded; safe fallback for old imported leads (never blank/system).
  const createdByLabel = (l) => agentName(l.created_by) || (l.created_by ? "—" : "Imported");
  const assignable = agents.filter((a) => a.active !== false && (a.role === "agent" || a.role === "sales_manager"));
  const matchAgentFilter = (l) => {
    if (isAgent || !agentFilter) return true;
    if (agentFilter === "unassigned") return !l.assigned_agent && !l.is_open;
    if (agentFilter === "open") return l.is_open === true && String(l.lead_type || "").trim().toLowerCase() !== "agent";
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
    try { await supabase.rpc("reveal_contact", { p_lead_id: l.id }); } catch (e) {}
    if (me) logAction("view_number", l, me.id);
  };

  const TABS = ["all", "New", "Hot", "Very Hot", "Warm", "Cold", "Follow-up due", "Overdue", "Closed Won", "Closed Lost"];
  const TAB_TONE = { Hot: T.bad, "Very Hot": T.bad, Warm: T.warn, Cold: T.muted, "Closed Won": T.ok, "Closed Lost": T.bad, Overdue: T.bad, "Follow-up due": T.gold, New: T.gold };
  const tabCount = (t) => tabCounts[t] ?? 0;
  const filtered = leads || [];   // current server page — scope, filters, search, sort + pagination already applied in the DB
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };
  const selIds = Object.keys(selected).filter((k) => selected[k]);
  const toggleSel = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const allVisibleSelected = filtered.length > 0 && filtered.every((l) => selected[l.id]);
  const toggleSelAll = () => { if (allVisibleSelected) { setSelected({}); } else { const n = {}; filtered.forEach((l) => { n[l.id] = true; }); setSelected(n); } };
  const clearSel = () => setSelected({});
  const runBulk = async ({ mode, agentId, reason }) => {
    let ids = selIds;
    let sel = (leads || []).filter((l) => selected[l.id]);
    if (selectAllMatching) {
      try {
        setToast("Gathering all matching leads…");
        ids = []; let from = 0;
        for (;;) {
          const { data, error } = await applyFilters(supabase.from("leads").select("id"), tab, me?.id).order("created_at", { ascending: false }).range(from, from + 999);
          if (error) throw error;
          ids = ids.concat((data || []).map((r) => r.id));
          if (!data || data.length < 1000) break;
          from += 1000; if (from >= 200000) break;
        }
        sel = [];   // full set: row objects aren't all loaded; per-row history/audit skipped, summary audit records the count
      } catch (e) { flash("Could not gather all matching leads: " + (e.message || "please try again")); return; }
    }
    if (!ids.length) return;
    const nowIso = new Date().toISOString();
    let shared = {}, toName = null;
    if (mode === "assign") { toName = agentName(agentId); shared = { assigned_agent: agentId, assigned_agent_name: toName, current_owner: agentId, assigned_at: nowIso, is_open: false, opened_reason: null, opened_by: null, opened_at: null }; }
    else if (mode === "open") { shared = { is_open: true, assigned_agent: null, assigned_agent_name: null, current_owner: null, opened_reason: reason || "Lead redistribution", opened_by: me?.id || null, opened_at: nowIso }; }
    else { shared = { is_open: false, assigned_agent: null, assigned_agent_name: null, current_owner: null }; }
    const CHUNK = 150;   // keep each .in(id,...) URL well under proxy limits; a single 2700-id call fails
    const chunks = (arr) => { const o = []; for (let i = 0; i < arr.length; i += CHUNK) o.push(arr.slice(i, i + CHUNK)); return o; };
    try {
      setToast("Working on " + ids.length + " lead" + (ids.length === 1 ? "" : "s") + "… please keep this open.");
      // 1) main update — BATCHED. A single .in("id", [thousands]) builds a URL too long for the API and fails.
      for (const part of chunks(ids)) {
        const { error } = await supabase.from("leads").update(shared).in("id", part);
        if (error) throw error;
      }
      // 2) preserve original_agent when opening previously-assigned leads — grouped by agent, batched (no per-row loop)
      if (mode === "open") {
        const byAgent = {};
        sel.filter((x) => !x.original_agent && x.assigned_agent).forEach((l) => { (byAgent[l.assigned_agent] = byAgent[l.assigned_agent] || []).push(l.id); });
        for (const ag of Object.keys(byAgent)) { for (const part of chunks(byAgent[ag])) { try { await supabase.from("leads").update({ original_agent: ag }).in("id", part); } catch (e) {} } }
      }
      // 3) ownership history — batched, best-effort
      try {
        const hist = sel.map((l) => ({ lead_id: l.id, from_agent: l.assigned_agent || null, to_agent: mode === "assign" ? agentId : null, reason: reason || (mode === "open" ? "Moved to Open Leads" : mode === "unassign" ? "Unassigned" : "Bulk reassignment"), changed_by: me?.id || null }));
        for (const part of chunks(hist)) { await supabase.from("lead_ownership_history").insert(part); }
      } catch (e) {}
      if (mode === "assign" && agentId) { try { await supabase.from("notifications").insert({ user_id: agentId, kind: "lead_assigned", title: ids.length + (ids.length === 1 ? " lead assigned to you" : " leads assigned to you"), body: "You have " + ids.length + " newly assigned " + (ids.length === 1 ? "lead" : "leads") + (reason ? " — " + reason : ""), link_screen: "live" }); } catch (e) {} }
      if (mode === "assign" && agentId) pushNotify({ summary: true, agentId, count: ids.length });   // one digest push to the agent's phone
      // 4) audit — summary always; per-row only for smaller batches (avoid thousands of audit rows on a big redistribution)
      try {
        await supabase.from("admin_audit").insert({ action: mode === "assign" ? "leads_bulk_assigned" : mode === "open" ? "leads_bulk_opened" : "leads_bulk_unassigned", performed_by: me?.id || null, new_value: { count: ids.length, to: toName, mode, reason: reason || null }, detail: ids.length + (mode === "assign" ? " → " + (toName || "agent") : mode === "open" ? " → Open Leads" : " → Unassigned") });
        if (sel.length <= 400) { const per = sel.map((l) => ({ action: "lead_assigned", performed_by: me?.id || null, affected_user: mode === "assign" ? agentId : null, old_value: { agent: l.assigned_agent_name || null }, new_value: { mode, to: toName }, detail: (l.lead_code || l.client_name || "lead") })); for (const part of chunks(per)) { await supabase.from("admin_audit").insert(part); } }
      } catch (e) {}
      setShowBulk(false); clearSel(); setSelectAllMatching(false); await load();
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
          {total.toLocaleString()} {total === 1 ? "lead" : "leads"}</span>
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {isAgent ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.goldSoft, color: T.gold,
            borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            <UserCircle size={12} /> {leads === null ? "Loading…" : `${total.toLocaleString()} ${total === 1 ? "lead" : "leads"}`}</span>
        ) : (<>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.okSoft, color: T.ok,
            borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: 7, background: T.ok }} /> LIVE DATABASE</span>
          <span style={{ fontSize: 12.5, color: T.muted }}>{leads === null ? "Loading…" : `${total.toLocaleString()} leads`}{loading && leads !== null ? " · updating…" : ""}</span>
        </>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={load} style={{ ...miniBtn() }}><RefreshCw size={13} /> Refresh</button>
        {isMaster && <button onClick={() => setShowImport(true)} style={{ ...miniBtn() }}><Upload size={13} /> Import file</button>}
        <button onClick={() => setShowAdd(true)} style={{ background: T.btnBg, color: T.btnFg, border: "none",
          borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI,
          display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Add lead</button>
      </div>
    </div>

    {err && <div style={{ ...card, padding: 14, marginTop: 14, borderColor: T.badSoft, color: T.bad, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><span>{err}</span><button onClick={() => load()} style={{ ...miniBtn(), borderColor: T.bad, color: T.bad }}>Retry</button></div>}

    <div style={{ ...card, padding: "10px 14px", marginTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
      <Search size={15} color={T.muted} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isAgent ? "Search my leads…" : "Search name, project, area, agent…"}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: UI, color: T.ink }} />
      {q && <span style={{ fontSize: 11.5, color: T.muted }}>{loading ? "…" : total.toLocaleString() + " match"}</span>}
    </div>

    {isAgent && <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600, marginRight: 2 }}>Type</span>
      {["", ...LEAD_TYPES].map((t) => (
        <button key={t || "all"} onClick={() => setTypeFilter(t)} style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${typeFilter === t ? T.gold : T.hair}`, background: typeFilter === t ? T.goldSoft : T.paper, color: typeFilter === t ? T.gold : T.muted, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: UI }}>{t || "All"}</button>
      ))}
    </div>}

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
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>Lead type</span>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ border: `1px solid ${typeFilter ? T.gold : T.hair}`, borderRadius: 9, padding: "7px 10px", fontSize: 12.5, fontFamily: UI, color: T.ink, background: T.paper, cursor: "pointer" }}>
          <option value="">All types</option>
          {LEAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {agentFilter && <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.goldSoft, color: T.gold, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700 }}>
        Showing: {agentFilter === "unassigned" ? "Unassigned leads" : agentFilter === "open" ? "Open leads" : ("leads assigned to " + (agentName(agentFilter) || "agent"))}
        <button onClick={() => setAgentFilter(null)} title="Clear filter" style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", padding: 0, display: "grid" }}><X size={13} /></button>
      </span>}
    </div>}

    {!isAgent && (selIds.length > 0 || selectAllMatching) && (
      <div style={{ ...card, padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: T.ink, color: "#fff", borderColor: T.ink }}>
        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{(selectAllMatching ? total : selIds.length).toLocaleString()} selected{selectAllMatching ? " (all matching)" : ""}</span>
        {!selectAllMatching && allVisibleSelected && total > selIds.length && (
          <button onClick={() => setSelectAllMatching(true)} style={{ background: "rgba(255,255,255,.16)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 9, padding: "8px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Select all {total.toLocaleString()} matching</button>
        )}
        <button onClick={() => setShowBulk(true)} style={{ background: T.gold, color: "#1a1205", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 6 }}><UserPlus size={14} /> Assign / move</button>
        <button onClick={() => { clearSel(); setSelectAllMatching(false); }} style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Clear</button>
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
      <div style={{ ...card, padding: 0, marginTop: 14, overflow: "hidden" }}>
        {[0,1,2,3,4,5,6,7].map((i) => (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "15px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none" }}>
            <div style={{ width: 90, height: 11, borderRadius: 6, background: T.bone }} />
            <div style={{ flex: 1, height: 11, borderRadius: 6, background: T.bone }} />
            <div style={{ width: 130, height: 11, borderRadius: 6, background: T.bone }} />
            <div style={{ width: 70, height: 11, borderRadius: 6, background: T.bone }} />
          </div>
        ))}
      </div>
    ) : total === 0 ? (
      <div style={{ ...card, padding: 44, marginTop: 14, textAlign: "center" }}>
        <UserCircle size={26} color={T.faint} style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 700, fontSize: 15 }}>{(dq || (tab && tab !== "all") || agentFilter || typeFilter || filter) ? "No leads match" : (isAgent ? "No leads assigned yet" : "No leads yet")}</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, maxWidth: 360, marginInline: "auto", lineHeight: 1.5 }}>
          {(dq || (tab && tab !== "all") || agentFilter || typeFilter || filter) ? "Try clearing the search or filters above."
            : isAgent ? "When your manager assigns leads to you — or you add your own with the button above — they'll appear here."
            : "Import an Excel or CSV file, or use Add lead above to get started."}</div>
      </div>
    ) : (
      <div style={{ ...card, overflow: "hidden", marginTop: 14 }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: isAgent ? 900 : 2040 }}>
            <div className="amber-grid" style={{ display: "grid", gridTemplateColumns: isAgent ? "1.5fr 1.2fr 1fr 1fr 1.1fr 0.85fr 1fr" : "0.5fr 1.2fr 1.5fr 1.2fr 1.4fr 1.1fr 0.85fr 1.2fr 0.9fr 0.9fr 0.9fr 0.85fr 0.95fr 0.95fr 1fr", gap: 8,
              padding: "10px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
              color: T.muted, borderBottom: `1px solid ${T.hair}`, background: T.bone }}>
              {isAgent ? <><span>Client</span><span>Project</span><span>Location</span><span>Budget</span><span>Next follow-up</span><span>Status</span><span>Contact</span></>
                       : <><span style={{ display: "grid", placeItems: "center", position: "sticky", left: 0, zIndex: 3, background: T.bone, margin: "-10px 0", padding: "10px 0" }}><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelAll} title="Select all visible" style={{ cursor: "pointer", width: 14, height: 14 }} /></span><span>Date</span><span>Client</span><span>Phone</span><span>Email</span><span>Agent</span><span>Type</span><span>Project</span><span>Area</span><span>Source</span><span>Status</span><span>Temp</span><span>Last contact</span><span>Next f/u</span><span>Created by</span></>}
            </div>
            {filtered.map((l, i) => (isAgent ? (
              <div key={l.id} onClick={() => { try { sessionStorage.setItem("amber_lvscroll_" + viewKey, String(window.scrollY || 0)); } catch (e) {} openLead && openLead(l.id, allIds.length ? allIds : filtered.map((x) => x.id)); }} className="amber-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr 1fr 1.1fr 0.85fr 1fr",
                gap: 8, alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12.5, cursor: "pointer" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>{l.client_name}
                    {(l.temperature === "Hot" || l.temperature === "Very Hot") && <span style={{ width: 7, height: 7, borderRadius: 7, background: T.bad }} />}</div>
                  <div style={{ fontSize: 10.5, color: T.faint, display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontWeight: 700, color: (l.lead_type || "Buyer") === "Buyer" ? T.info : T.muted }}>{l.lead_type || "Buyer"}</span></div>
                </div>
                <span style={{ color: T.inkSoft }}>{l.project || "—"}</span>
                <span style={{ color: T.inkSoft }}>{l.area || "—"}</span>
                <span style={{ color: T.inkSoft }}>{l.budget || "—"}</span>
                <span style={{ color: l.next_followup && l.next_followup < today ? T.bad : T.inkSoft, fontSize: 12 }}>
                  {l.next_followup || "—"}</span>
                <Chip tone={l.is_open ? "gold" : l.temperature === "Hot" || l.temperature === "Very Hot" ? "bad" : "info"}>{l.is_open ? "Open" : l.status}</Chip>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {l.is_open ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, border: `1px solid ${T.hair}`, borderRadius: 8, padding: "5px 9px", display: "inline-flex", alignItems: "center", gap: 4 }}><Lock size={11} /> Reveal inside</span>
                  ) : !revealed[l.id] ? (
                    l.phone ? <button onClick={(e) => { e.stopPropagation(); reveal(l); }} title="Reveal contact"
                      style={{ borderRadius: 999, background: T.goldSoft, border: `1px solid ${T.gold}`, color: T.gold, padding: "5px 11px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Eye size={12} /> Reveal</button> : <span style={{ color: T.faint }}>—</span>
                  ) : <>
                  {l.phone && <a href={waHref(l.phone)} target="_blank" rel="noreferrer" title="WhatsApp"
                    onClick={(e) => { e.stopPropagation(); logAction("whatsapp", l, me && me.id); }}
                    style={{ width: 30, height: 30, borderRadius: 8, background: T.okSoft, display: "grid", placeItems: "center", textDecoration: "none" }}>
                    <MessageCircle size={14} color={WA} /></a>}
                  {l.phone && <a href={telHref(l.phone)} title="Call"
                    onClick={(e) => { e.stopPropagation(); logActivityReliable("call", l, me && me.id); stampContactedReliable(l.id, me && me.id); }}
                    style={{ width: 30, height: 30, borderRadius: 8, background: T.bone, border: `1px solid ${T.hair}`, display: "grid", placeItems: "center", textDecoration: "none" }}>
                    <Phone size={13} color={T.inkSoft} /></a>}
                  </>}
                </span>
              </div>
            ) : (
              <div key={l.id} onClick={() => { try { sessionStorage.setItem("amber_lvscroll_" + viewKey, String(window.scrollY || 0)); } catch (e) {} openLead && openLead(l.id, allIds.length ? allIds : filtered.map((x) => x.id)); }} className="amber-grid" style={{ display: "grid", gridTemplateColumns: "0.5fr 1.2fr 1.5fr 1.2fr 1.4fr 1.1fr 0.85fr 1.2fr 0.9fr 0.9fr 0.9fr 0.85fr 0.95fr 0.95fr 1fr",
                gap: 8, alignItems: "center", padding: "12px 16px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12, cursor: "pointer", background: selected[l.id] ? T.goldSoft : "transparent" }}>
                <span onClick={(e) => e.stopPropagation()} style={{ display: "grid", placeItems: "center", position: "sticky", left: 0, zIndex: 2, background: selected[l.id] ? T.goldSoft : T.paper, margin: "-12px 0", padding: "12px 0" }}><input type="checkbox" checked={!!selected[l.id]} onChange={() => toggleSel(l.id)} style={{ cursor: "pointer", width: 14, height: 14 }} /></span>
                <span style={{ fontSize: 10.5, color: T.inkSoft, fontWeight: 600, lineHeight: 1.3 }}>{fmtDubai(l.created_at || l.created_on)}</span>
                <span style={{ fontWeight: 600 }}>{l.client_name}</span>
                <span style={{ fontSize: 11.5 }}>{l.phone || <span style={{ color: T.faint }}>—</span>}</span>
                <span style={{ fontSize: 11.5, color: l.email ? T.inkSoft : T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.email || "No email"}</span>
                <button onClick={(e) => { e.stopPropagation(); if (l.is_open) setAgentFilter("open"); else if (l.assigned_agent) setAgentFilter(l.assigned_agent); else setAgentFilter("unassigned"); }} title="Filter by this agent" style={{ background: "none", border: "none", textAlign: "left", padding: 0, cursor: "pointer", fontFamily: UI, fontSize: 12, color: l.is_open ? T.gold : (l.assigned_agent_name ? T.gold : T.faint), fontWeight: l.assigned_agent_name || l.is_open ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.is_open ? "Open" : (l.assigned_agent_name || "Unassigned")}</button>
                <span style={{ fontSize: 10.5 }}><Chip tone={(l.lead_type || "Buyer") === "Buyer" ? "info" : (l.lead_type === "Seller" ? "gold" : "muted")}>{l.lead_type || "Buyer"}</Chip></span>
                <span style={{ color: T.inkSoft }}>{l.project || "—"}</span>
                <span style={{ color: T.inkSoft }}>{l.area || "—"}</span>
                <span style={{ color: T.inkSoft, fontSize: 11 }}>{l.source || "—"}</span>
                <Chip tone={l.is_open ? "gold" : "info"}>{l.is_open ? "Open" : l.status}</Chip>
                <span style={{ fontSize: 11 }}><Chip tone={l.temperature === "Hot" || l.temperature === "Very Hot" ? "bad" : l.temperature === "Warm" ? "warn" : "info"}>{l.temperature || "—"}</Chip></span>
                <span style={{ fontSize: 11, color: T.inkSoft }}>{l.last_contacted ? fmtDay(l.last_contacted) : "—"}</span>
                <span style={{ fontSize: 11, color: l.next_followup && l.next_followup < today ? T.bad : T.inkSoft }}>{l.next_followup ? fmtDay(l.next_followup) : "—"}</span>
                <span style={{ fontSize: 11, color: T.faint }}>{createdByLabel(l)}</span>
              </div>
            )))}
          </div>
        </div>
        {total > PAGE && (() => { const totalPages = Math.max(1, Math.ceil(total / PAGE)); return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", borderTop: `1px solid ${T.hairSoft}`, background: T.bone }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 12, color: T.muted }}>
              <span>Showing {(page * PAGE + 1).toLocaleString()}–{Math.min((page + 1) * PAGE, total).toLocaleString()} of {total.toLocaleString()}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>Per page
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ border: `1px solid ${T.hair}`, borderRadius: 8, padding: "5px 8px", fontSize: 12, fontFamily: UI, color: T.ink, background: T.paper, cursor: "pointer" }}>
                  <option value={30}>30</option><option value={50}>50</option><option value={100}>100</option>
                </select>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setPage(0)} disabled={page === 0 || loading} style={{ ...miniBtn(), opacity: (page === 0 || loading) ? 0.45 : 1, cursor: (page === 0 || loading) ? "default" : "pointer" }}>«</button>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading} style={{ ...miniBtn(), opacity: (page === 0 || loading) ? 0.45 : 1, cursor: (page === 0 || loading) ? "default" : "pointer" }}>‹ Prev</button>
              {pageWindow(page, totalPages).map((n, i) => n === -1
                ? <span key={"e" + i} style={{ color: T.faint, padding: "0 2px", fontSize: 12 }}>…</span>
                : <button key={n} onClick={() => setPage(n)} disabled={loading} style={{ ...miniBtn(), minWidth: 34, fontWeight: n === page ? 800 : 600, background: n === page ? T.btnBg : T.paper, color: n === page ? T.btnFg : T.ink, borderColor: n === page ? T.btnBg : T.hair, cursor: loading ? "default" : "pointer" }}>{(n + 1).toLocaleString()}</button>)}
              <button onClick={() => setPage((p) => ((p + 1) * PAGE < total ? p + 1 : p))} disabled={(page + 1) * PAGE >= total || loading} style={{ ...miniBtn(), opacity: ((page + 1) * PAGE >= total || loading) ? 0.45 : 1, cursor: ((page + 1) * PAGE >= total || loading) ? "default" : "pointer" }}>Next ›</button>
              <button onClick={() => setPage(totalPages - 1)} disabled={(page + 1) * PAGE >= total || loading} style={{ ...miniBtn(), opacity: ((page + 1) * PAGE >= total || loading) ? 0.45 : 1, cursor: ((page + 1) * PAGE >= total || loading) ? "default" : "pointer" }}>»</button>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: T.muted }}>Go to
                <input type="number" min={1} max={totalPages} value={jumpVal} onChange={(e) => setJumpVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const n = Math.min(totalPages, Math.max(1, parseInt(jumpVal || "1", 10) || 1)); setPage(n - 1); setJumpVal(""); } }} placeholder={String(page + 1)} style={{ width: 56, border: `1px solid ${T.hair}`, borderRadius: 8, padding: "5px 8px", fontSize: 12, fontFamily: UI, color: T.ink, background: T.paper }} />
                <button onClick={() => { const n = Math.min(totalPages, Math.max(1, parseInt(jumpVal || "1", 10) || 1)); setPage(n - 1); setJumpVal(""); }} disabled={loading} style={{ ...miniBtn(), cursor: loading ? "default" : "pointer" }}>Go</button>
              </span>
            </div>
          </div>
        ); })()}
      </div>
    )}
    <div style={{ fontSize: 11, color: T.faint, marginTop: 10 }}>
      {isAgent ? "These are your leads only. Tap WhatsApp or call to reach a client directly."
               : "Master Admin sees full client contact details. What each person sees is enforced by row-level security; agent reveals are logged."}
    </div>

    {showAdd && <AddLeadModal me={me} user={user} openLead={openLead} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    {showImport && <ImportModal me={me} onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load(); }} />}
    {showBulk && <BulkAssignModal count={selectAllMatching ? total : selIds.length} agents={assignable} onClose={() => setShowBulk(false)} onRun={runBulk} />}
    {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.ink, color: "#fff", padding: "11px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: T.shadowLg }}>{toast}</div>}
  </div>;
}
function pageWindow(cur, totalP) {
  if (totalP <= 7) return Array.from({ length: totalP }, (_, i) => i);
  const picked = [0, totalP - 1, cur, cur - 1, cur + 1].filter((n) => n >= 0 && n < totalP);
  const uniq = Array.from(new Set(picked)).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < uniq.length; i++) { if (i && uniq[i] - uniq[i - 1] > 1) out.push(-1); out.push(uniq[i]); }
  return out;
}
function miniBtn() { return { background: T.paper, color: T.ink, border: `1px solid ${T.hair}`, borderRadius: 9,
  padding: "8px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: UI,
  display: "inline-flex", alignItems: "center", gap: 6 }; }

/* ---- Add Lead: validation + duplicate check + autocomplete + AI extract ---- */
const DUBAI_AREAS = ["Downtown Dubai","Business Bay","Dubai Marina","Palm Jumeirah","Palm Jebel Ali","Dubai Hills Estate","Jumeirah Village Circle","JVC","Jumeirah Village Triangle","JVT","City Walk","Meydan","Dubai Creek Harbour","Dubai Islands","Emaar South","The Valley","Arabian Ranches","Arabian Ranches 2","Arabian Ranches 3","Tilal Al Ghaf","Damac Lagoons","Damac Hills","Damac Hills 2","Sobha Hartland","Dubai South","Jumeirah Golf Estates","Dubai Sports City","Motor City","Al Furjan","Mohammed Bin Rashid City","MBR City","District One","Dubai Production City","Dubai Investment Park","DIFC","Jumeirah Lake Towers","JLT","Bluewaters","Port de La Mer","Rashid Yachts and Marina","Dubai Design District","Nad Al Sheba","The Acres","Emirates Living","Springs","Meadows","The Lakes","Madinat Jumeirah Living","Expo City","Jumeirah Beach Residence","JBR","Al Barsha","Town Square","Dubailand","Discovery Gardens","International City","Mirdif","Jumeirah","Umm Suqeim"];
const DUBAI_PROJECTS = ["Palm Jebel Ali","Dubai Hills Estate","Emaar South","The Valley","Rashid Yachts and Marina","Dubai Creek Harbour","City Walk","Madinat Jumeirah Living","Nad Al Sheba Gardens","District One","Damac Lagoons","Damac Hills","Sobha Hartland","Sobha One","Sobha Reserve","Tilal Al Ghaf","Arabian Ranches 3","Expo City","Dubai Islands","Bay Villas","Bluewaters Residences","Jumeirah Living"];
const LEAD_TYPES = ["Buyer", "Seller", "Tenant", "Agent"];
const LEAD_SOURCES = ["Property Finder", "Off Plan Campaign", "WhatsApp Marketing", "Email Marketing", "Social Media", "Personal Lead"];
const normPhone = (p) => { if (!p) return ""; let d = String(p).replace(/[^\d+]/g, ""); if (d.startsWith("00")) d = "+" + d.slice(2); else if (!d.startsWith("+")) d = "+" + d; return d; };

function AddLeadModal({ onClose, onSaved, me, user, openLead }) {
  const isAgent = user && user.role === "agent";
  // Only Master Admin / Admin may assign a lead to another account (matches RLS: non-admins can
  // only insert a lead owned by themselves). Everyone else self-assigns.
  const canAssignOthers = !!(user && (user.role === "master_admin" || user.role === "admin"));
  const selfAssign = isAgent || !canAssignOthers;
  const [agents, setAgents] = useState([]);
  useEffect(() => {
    if (!canAssignOthers) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.from("profiles").select("id,full_name,role,active").in("role", ["agent", "sales_manager", "admin", "master_admin"]).order("full_name", { ascending: true });
      if (alive) setAgents((data || []).filter((p) => p.active !== false && String(p.full_name || "").trim()));
    })();
    return () => { alive = false; };
  }, [canAssignOthers]);
  const [mode, setMode] = useState("manual"); // manual | ai
  const [aiText, setAiText] = useState(""); const [aiBusy, setAiBusy] = useState(false); const [aiErr, setAiErr] = useState("");
  const [f, setF] = useState({ client_name: "", phone: "", whatsapp: "", waSame: true, email: "", project: "", area: "", budget: "",
    property_type: "", ready_offplan: "", purpose: "", nationality: "", country_residence: "", language: "", developer: "",
    finance: "", source: "", timeline: "", followup_note: "", lead_type: "Buyer", assigned_agent: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [dup, setDup] = useState(null); // pending duplicate, requires confirm
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const extract = async () => {
    if (!aiText.trim()) return; setAiBusy(true); setAiErr("");
    try {
      const res = await callAi({
          system: "Extract real-estate lead fields from the user's text. Reply with ONLY a JSON object, no prose, with keys: client_name, phone, email, nationality, country_residence, language, lead_type, budget, purpose, area, project, developer, property_type, ready_offplan, finance, timeline, source, followup_note. Use empty string for anything not present. budget should keep currency like 'AED 8,000,000'. ready_offplan should be 'Off-plan' or 'Ready' or 'Either' or ''. finance should be 'Cash' or 'Mortgage' or 'Not decided' or ''. source should be one of 'Property Finder','Off Plan Campaign','WhatsApp Marketing','Email Marketing','Social Media','Personal Lead' or ''.",
          messages: [{ role: "user", content: aiText.slice(0, 4000) }] });
      const data = await res.json();
      if (data.error) { setAiErr("AI not available: " + data.error); setAiBusy(false); return; }
      let txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      txt = txt.replace(/^```json/i, "").replace(/```$/, "").trim();
      const j = JSON.parse(txt);
      setF((s) => ({ ...s, ...Object.fromEntries(Object.entries(j).map(([k, v]) => [k, v || ""])) }));
      setMode("manual"); // show the filled form for review
    } catch (e) { setAiErr("Couldn't read AI response. Try again or enter manually."); }
    setAiBusy(false);
  };

  const doInsert = async (overrideDup) => {
    setBusy(true); setErr("");
    const phone = toE164(f.phone);                       // already E.164 from SmartPhoneInput; idempotent
    const whatsapp = f.waSame ? phone : (toE164(f.whatsapp) || phone);
    // Duplicate fail-safe. Uses a SECURITY DEFINER RPC so an agent's check also catches numbers held by
    // OTHER agents (which RLS would otherwise hide) — without leaking those leads' details.
    if (!overrideDup) {
      let dupInfo = null;
      const res = await supabase.rpc("check_duplicate_phone", { p_phone: phone });
      if (!res.error) dupInfo = res.data;
      else {
        // RPC not deployed yet (migration 23) — fall back to a direct, RLS-scoped lookup.
        const { data: hit } = await supabase.from("leads")
          .select("id, lead_code, client_name, assigned_agent_name, status, project, area, created_at")
          .eq("phone", phone).limit(1);
        dupInfo = (hit && hit.length)
          ? { exists: true, mine: true, lead_id: hit[0].id, lead_code: hit[0].lead_code, client_name: hit[0].client_name, assigned_agent_name: hit[0].assigned_agent_name, status: hit[0].status, project: hit[0].project, area: hit[0].area, created_at: hit[0].created_at }
          : { exists: false };
      }
      if (dupInfo && dupInfo.exists) {
        try { logAi({ user, question: "[duplicate add blocked] " + phone, responseSum: dupInfo.mine ? "own_lead" : (isAgent ? "other_agent" : "admin_view"), category: "crm", status: "blocked" }); } catch (e) {}
        setBusy(false);
        if (isAgent && !dupInfo.mine) { setErr("This lead already exists in the CRM. Please speak to your manager."); return; }
        if (isAgent && dupInfo.mine) { setDup({ kind: "mine", lead_id: dupInfo.lead_id }); return; }
        setDup({ kind: "admin", ...dupInfo }); return;     // admin: show details + Open Existing / override
      }
    }
    const code = "L-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const myId = (me && me.id) || (user && user.id) || null;
    const nowIso = new Date().toISOString();
    // created_by is always the creator. Agents MUST own the lead they create (RLS requires
    // created_by = assigned_agent = auth.uid()), and may not assign to anyone else. Admins/Master
    // Admin may leave it unassigned or assign by name via the form.
    // Assignment is always to a REAL account (chosen from the dropdown) or left Unassigned.
    // The assigned_agent uuid (FK to profiles) is the source of truth; the display name is derived
    // from that account — so a free-typed phantom like "Sir Saad" can no longer be saved.
    const selName = (id) => { const a = agents.find((x) => x.id === id); return (a && a.full_name) || null; };
    const ownName = (user && user.name) || (me && me.full_name) || null;
    const ownership = selfAssign
      ? { assigned_agent: myId, current_owner: myId, assigned_agent_name: ownName, assigned_at: nowIso, is_open: false }
      : (f.assigned_agent
          ? { assigned_agent: f.assigned_agent, current_owner: f.assigned_agent, assigned_agent_name: selName(f.assigned_agent), assigned_at: nowIso, is_open: false }
          : { assigned_agent: null, current_owner: null, assigned_agent_name: null });
    const payload = {
      lead_code: code, client_name: f.client_name.trim(), phone, whatsapp, email: f.email.trim() || null,
      project: f.project.trim() || null, area: f.area.trim() || null, budget: f.budget.trim() || null,
      property_type: f.property_type.trim() || null, ready_offplan: f.ready_offplan.trim() || null,
      lead_type: f.lead_type || "Buyer",
      purpose: f.purpose.trim() || null, nationality: f.nationality.trim() || null,
      country_residence: f.country_residence.trim() || null, language: f.language.trim() || null,
      developer: f.developer.trim() || null, finance: f.finance.trim() || null, timeline: f.timeline.trim() || null,
      followup_note: f.followup_note.trim() || null,
      source: f.source.trim() || "Manual", status: "New", temperature: "Hot", created_by: myId, ...ownership,
    };
    let { data: ins, error } = await supabase.from("leads").insert(payload).select("id").single();
    // Graceful degradation: if the lead_type column hasn't been added yet (migration 20 not applied), retry without it.
    if (error && /lead_type/i.test((error.message || "") + (error.details || "")) && /(column|schema|exist)/i.test((error.message || "") + (error.details || ""))) {
      const rest = { ...payload }; delete rest.lead_type;
      ({ data: ins, error } = await supabase.from("leads").insert(rest).select("id").single());
    }
    if (error) { try { console.error("Add lead failed:", error); } catch (e) {} setBusy(false); setErr("Couldn't save this lead. Please check the details and try again."); return; }
    // audit
    if (me && ins) supabase.from("lead_activity").insert({ lead_id: ins.id, actor_id: me.id,
      action: aiUsed ? "lead_created_ai" : "lead_created", detail: { lead_code: code } }).then(() => {});
    if (ins && ins.id) pushNotify({ leadId: ins.id });   // email/push the assignee (server no-ops if the lead is unassigned)
    setBusy(false); onSaved();
  };
  const [aiUsed] = useState(false);

  const doReadd = async () => {
    if (!dup || !dup.lead_id) return;
    setBusy(true); setErr("");
    const p_new = {
      project: (f.project || "").trim(), area: (f.area || "").trim(), budget: (f.budget || "").trim(),
      property_type: (f.property_type || "").trim(), purpose: (f.purpose || "").trim(),
      ready_offplan: (f.ready_offplan || "").trim(), lead_type: f.lead_type || "",
      nationality: (f.nationality || "").trim(), followup_note: (f.followup_note || "").trim(),
    };
    const { data, error } = await supabase.rpc("readd_lead", { p_lead_id: dup.lead_id, p_new });
    setBusy(false);
    if (error || !data || !data.ok) { setErr("Couldn't re-add to the existing lead. " + ((error && error.message) || (data && data.error) || "Please try again.")); return; }
    setDup(null);
    if (openLead) { openLead(dup.lead_id); onClose(); } else { onSaved(); }
  };

  const save = () => {
    if (!f.client_name.trim()) { setErr("Client name is required."); return; }
    const p = toE164(f.phone); if (!p || digitsOnly(p).length < 8) { setErr("A valid phone number is required to create a lead."); return; }
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
  const selField = (lbl, k, options, ph) => (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>{lbl}</span>
      <select value={f[k]} onChange={(e) => set(k, e.target.value)} style={inp}>
        <option value="">{ph || "Select…"}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
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
      <label style={{ display: "block", marginBottom: 6 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Phone * (required)</span>
        <SmartPhoneInput value={f.phone} onChange={(v) => set("phone", v)} placeholder="Phone number" />
      </label>
      <div style={{ fontSize: 10.5, color: T.faint, margin: "0 0 10px", lineHeight: 1.45 }}>Phone number is used to prevent duplicate leads.</div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: f.waSame ? 12 : 8, cursor: "pointer", fontSize: 12.5, color: T.inkSoft }}>
        <input type="checkbox" checked={f.waSame} onChange={(e) => set("waSame", e.target.checked)} style={{ width: 15, height: 15 }} /> WhatsApp same as phone
      </label>
      {!f.waSame && (
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>WhatsApp number</span>
          <SmartPhoneInput value={f.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="WhatsApp number" />
        </label>
      )}
      {field("Email", "email", { ph: "optional" })}
      {field("Nationality", "nationality")}
      {field("Country of residence", "country_residence")}
      {field("Language", "language", { ph: "e.g. English / Arabic / Russian" })}
      {selField("Lead source", "source", LEAD_SOURCES, "Select source…")}
      <label style={{ display: "block", marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Lead type</span>
        <select value={f.lead_type} onChange={(e) => set("lead_type", e.target.value)} style={inp}>{LEAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
      </label>
      {field("Budget", "budget", { ph: "AED …" })}
      {field("Purpose", "purpose", { ph: "Investment / End-use / Golden Visa" })}
      {field("Area / Community", "area", { list: "areas", ph: "Select or type a community" })}
      {field("Project name", "project", { ph: "Specific project/building, if known — type manually" })}
      <div style={{ fontSize: 10.5, color: T.faint, margin: "-4px 0 12px", lineHeight: 1.45 }}>Area is the community/location (e.g. Dubai Hills Estate). Project name is the specific project/building, if known (e.g. Sobha One).</div>
      {field("Developer", "developer", { ph: "e.g. Emaar, Damac, Sobha" })}
      {field("Property type", "property_type", { ph: "Villa / Apartment / Townhouse …" })}
      {selField("Ready / Off-plan", "ready_offplan", ["Off-plan", "Ready", "Either"], "Select…")}
      {selField("Finance", "finance", ["Cash", "Mortgage", "Not decided"], "Select…")}
      {field("Timeline", "timeline", { ph: "e.g. 1–2 months, immediate" })}
      {field("Follow-up note", "followup_note")}
      {selfAssign ? (
        <label style={{ display: "block", marginBottom: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Assigned to (you)</span>
          <input value={(user && user.name) || ""} disabled style={{ ...inp, opacity: .6 }} />
        </label>
      ) : (
        <label style={{ display: "block", marginBottom: 4 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Assign to</span>
          <select value={f.assigned_agent} onChange={(e) => set("assigned_agent", e.target.value)} style={inp}>
            <option value="">Unassigned (add to pool)</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}{a.role && a.role !== "agent" ? " \u00b7 " + roleLabel(a.role) : ""}</option>)}
          </select>
        </label>
      )}
      {!selfAssign && <div style={{ fontSize: 10.5, color: T.faint, margin: "0 0 10px", lineHeight: 1.45 }}>Only existing accounts can be assigned — choose a name from the list, or leave <b>Unassigned</b> to add it to the pool.{agents.length === 0 ? " (No active accounts loaded yet.)" : ""}</div>}
      <div style={{ fontSize: 10.5, color: T.faint, margin: "-2px 0 8px", lineHeight: 1.45 }}>New leads are saved as <b>Hot</b> by default — change the temperature later from the lead's page if needed.</div>
      {err && <div style={{ color: T.bad, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
      {dup && dup.kind === "mine" && <div style={{ ...card, padding: 12, marginBottom: 10, borderColor: T.warnSoft, background: T.warnSoft }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.warn }}>This lead already exists in your leads.</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => { if (openLead && dup.lead_id) { openLead(dup.lead_id); onClose(); } }} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold }}>Open Lead</button>
          <button onClick={() => setDup(null)} style={{ ...miniBtn() }}>Cancel</button>
        </div>
      </div>}
      {dup && dup.kind === "admin" && <div style={{ ...card, padding: 12, marginBottom: 10, borderColor: T.warnSoft, background: T.warnSoft }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.warn }}>Duplicate found — this number is already on a lead</div>
        <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
          {(dup.client_name || "—")}{dup.lead_code ? " · " + dup.lead_code : ""}<br />
          Agent: {dup.assigned_agent_name || "Unassigned"} · Status: {dup.status || "New"}<br />
          {(dup.project || dup.area) ? ((dup.project || "") + (dup.project && dup.area ? " · " : "") + (dup.area || "")) : "No project/area"}{dup.created_at ? " · created " + new Date(dup.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
        </div>
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8, lineHeight: 1.45 }}>Re-add updates this existing lead with the new enquiry details and saves the previous details into its notes — no duplicate is created.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {dup.lead_id && <button onClick={doReadd} disabled={busy} style={{ ...miniBtn(), borderColor: T.ok, color: T.ok }}>{busy ? "Re-adding…" : "Re-add (update existing)"}</button>}
          {dup.lead_id && <button onClick={() => { if (openLead) { openLead(dup.lead_id); onClose(); } }} style={{ ...miniBtn(), borderColor: T.gold, color: T.gold }}>Open Existing Lead</button>}
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
  const [result, setResult] = useState(null);   // { created, skipped, invalid } after an import run

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
    if (!rows || !rows.length) return; setBusy(true); setErr(""); setDone(0);
    // Existing numbers (resilient: prefer normalized_phone, else derive from phone). Import defaults
    // bare local numbers to UAE (+971), matching the server normalizer.
    let existing = new Set();
    let ex = await supabase.from("leads").select("normalized_phone").limit(5000);
    if (ex.error) ex = await supabase.from("leads").select("phone").limit(5000);
    (ex.data || []).forEach((r) => { const k = r.normalized_phone || toE164(r.phone, "971"); if (k) existing.add(k); });
    const seen = new Set(); const valid = []; let skipped = 0, invalid = 0;
    for (const x of rows) {
      const e164 = toE164(x.phone, "971");
      if (!e164 || digitsOnly(e164).length < 8) { invalid++; continue; }
      if (existing.has(e164) || seen.has(e164)) { skipped++; continue; }
      seen.add(e164); valid.push({ ...x, _e164: e164 });
    }
    let created = 0;
    for (let i = 0; i < valid.length; i += 50) {
      const batch = valid.slice(i, i + 50).map((x, j) => ({
        lead_code: "L-" + Date.now().toString(36).slice(-4) + (i + j),
        client_name: x.client_name, phone: x._e164, whatsapp: x._e164, email: x.email || null,
        project: x.project || null, area: x.area || null, assigned_agent_name: x.assigned_agent_name || null,
        source: "Import", status: "New", temperature: "Cold" }));
      const { error } = await supabase.from("leads").insert(batch);
      if (error) { try { console.error("Import failed:", error); } catch (e) {} setErr("Some rows couldn't be imported after " + created + " saved. Please check the file and try again."); setBusy(false); return; }
      created += batch.length; setDone(created);
    }
    setResult({ created, skipped, invalid }); setBusy(false);
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
    {result ? <>
      <div style={{ ...card, padding: 12, marginBottom: 12, fontSize: 12.8, lineHeight: 1.7 }}>
        <div style={{ fontWeight: 700, color: T.ink, marginBottom: 4 }}>Import complete</div>
        <div style={{ color: T.ok, fontWeight: 700 }}>{result.created} created</div>
        <div style={{ color: T.warn }}>{result.skipped} skipped (duplicate phone numbers)</div>
        <div style={{ color: result.invalid ? T.bad : T.muted }}>{result.invalid} skipped (missing/invalid phone)</div>
      </div>
      <button onClick={onDone} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI }}>Done</button>
    </> : <button onClick={run} disabled={!rows || busy} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
      borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, cursor: rows ? "pointer" : "default",
      fontFamily: UI, opacity: (!rows || busy) ? .5 : 1 }}>{busy ? "Importing…" : `Import ${rows ? rows.length : ""} leads`}</button>}
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
  // plain function (not an inline component) -> inputs reconcile by DOM type, no remount, focus preserved
  const field = ({ k, label, type, opts, area, ph }) => (
    <div key={k}><span style={lbl}>{label}</span>
      {opts ? <select value={f[k] || ""} onChange={(e) => set(k, e.target.value)} style={{ ...inp, background: T.paper }}>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : area ? <textarea value={f[k] || ""} onChange={(e) => set(k, e.target.value)} rows={2} placeholder={ph || ""} style={{ ...inp, resize: "vertical" }} />
          : <input type={type || "text"} value={f[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder={ph || ""} style={inp} />}</div>
  );
  return <Modal title={initial && initial.id ? "Edit hot resale deal" : "Post a hot resale deal"} onClose={onClose}>
    <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Your deal goes to an admin for approval before it appears to the team. Posting as <b style={{ color: T.ink }}>{me.name}</b>.</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {field({ k:"project_name", label:"Project name *", ph:"e.g. Palm Jebel Ali Villas" })}
      {field({ k:"area", label:"Location / area *", ph:"e.g. Dubai Hills Estate" })}
      {field({ k:"property_type", label:"Property type *", opts:PROP_TYPES })}
      {field({ k:"bedrooms", label:"Bedrooms", ph:"e.g. 3 BR" })}
      {field({ k:"price", label:"Price *", ph:"e.g. AED 4.2M" })}
      {field({ k:"expiry_date", label:"Expiry date", type:"date" })}
    </div>
    {field({ k:"deal_summary", label:"Deal summary *", area:true, ph:"One or two lines a buyer would care about." })}
    {field({ k:"why_hot", label:"Why it's a hot deal *", area:true, ph:"Below market? Motivated seller? Rare unit?" })}
    {field({ k:"contact_note", label:"Contact / internal note", area:true, ph:"Seller contact or internal note (not shown publicly)." })}
    <button onClick={() => setMore((m) => !m)} style={{ ...miniBtn(), marginTop: 12, padding: "7px 12px", fontSize: 12 }}>{more ? "− Hide" : "+ Add"} optional details</button>
    {more && <div style={{ marginTop: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {field({ k:"unit_number", label:"Unit number" })}
        {field({ k:"size_sqft", label:"Size (sqft)" })}
        {field({ k:"view", label:"View" })}
        {field({ k:"floor", label:"Floor" })}
        {field({ k:"occupancy", label:"Occupancy", opts:["", "Vacant", "Rented", "Vacant on transfer"] })}
        {field({ k:"seller_urgency", label:"Seller urgency", opts:["", "Low", "Medium", "High", "Distressed"] })}
        {field({ k:"last_txn", label:"Last transaction comp" })}
        {field({ k:"market_price", label:"Market price comp" })}
        {field({ k:"expected_roi", label:"Expected ROI / yield" })}
        {field({ k:"listing_link", label:"External listing link" })}
      </div>
      {field({ k:"client_suitability", label:"Client suitability", area:true, ph:"Who is this perfect for?" })}
      {field({ k:"whatsapp_pitch", label:"WhatsApp pitch text", area:true, ph:"Leave blank and the CRM will generate one." })}
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
  const [frame, setFrame] = useState("all");

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
    let txt;
    if (d.whatsapp_pitch && d.whatsapp_pitch.trim()) {
      txt = d.whatsapp_pitch.trim();
    } else {
      const where = [d.project_name, d.area].filter(Boolean).join(", ");
      const unit = [d.property_type, d.bedrooms ? d.bedrooms + " bed" : "", d.size_sqft ? d.size_sqft + " sqft" : ""].filter(Boolean).join(" · ");
      const lines = ["Hello, hope you're doing well.", ""];
      lines.push("A strong new resale opportunity has just come in" + (where ? " in " + where : "") + ".");
      const factLine = [unit, d.price ? "asking " + d.price : ""].filter(Boolean).join(" — ");
      if (factLine) lines.push(factLine);
      if (d.why_hot && d.why_hot.trim()) lines.push(d.why_hot.trim());
      lines.push("");
      lines.push("I'd be happy to share the full details. When is the best time I can give you a quick call to discuss?");
      txt = lines.join("\n");
    }
    try { navigator.clipboard.writeText(txt); } catch (e) {}
    flash("WhatsApp pitch copied"); audit("hot_deal_pitch_copied", d);
  };
  const askAmber = (d) => {
    audit("hot_deal_ask_amber", d);
    window.dispatchEvent(new CustomEvent("amber-open", { detail: { prompt: "Help me pitch this approved hot resale deal: " + d.project_name + " in " + d.area + ", " + d.property_type + (d.bedrooms ? " " + d.bedrooms : "") + ", " + d.price + ". Why it's hot: " + d.why_hot + ". Draft a warm, client-ready WhatsApp in Dubai style — short greeting, the deal, the value angle, then ask the best time for a quick call (do NOT mention viewing). Then in one short line, which of my clients might match?" } }));
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

  const Card = ({ d, ownerView }) => {
    const img = hotImageFrom(d.photos);
    const badgeTxt = d.featured ? "Featured" : isRecent(d.created_at, 7) ? "New" : null;
    const sizePart = d.size_sqft ? " · " + d.size_sqft + " sqft" : "";
    const foot = "Posted by " + (d.agent_name || "Agent") + " · " + fmtDate(d.created_at) + sizePart + (d.expiry_date ? " · expires " + fmtDate(d.expiry_date) : "");
    return (
      <HotCard img={img} badge={badgeTxt} name={d.project_name} desc={d.deal_summary || d.why_hot}
        price={d.price} beds={d.bedrooms} ptype={d.property_type} location={d.area} footNote={foot}>
        {ownerView && <div style={{ marginBottom: 2 }}>{badge(d.status)}{d.status === "Needs Correction" && d.approval_notes && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 5 }}>Note: {d.approval_notes}</div>}</div>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderTop: `1px solid ${T.hairSoft}`, paddingTop: 10 }}>
          <button onClick={() => openDetail(d)} style={{ ...miniBtn(), padding: "7px 11px", fontSize: 11.5 }}><Eye size={12} /> Details</button>
          {ownerView && (d.status === "Needs Correction" || d.status === "Draft") && <button onClick={() => { setEditDeal(d); setShowForm(true); }} style={{ ...miniBtn(), padding: "7px 11px", fontSize: 11.5 }}><Pencil size={12} /> Edit & resubmit</button>}
          {d.status === "Approved" && <>
            <button onClick={() => copyPitch(d)} style={{ ...miniBtn(), padding: "7px 11px", fontSize: 11.5, borderColor: T.ok, color: T.ok }}><MessageCircle size={12} /> Copy pitch</button>
            <button onClick={() => askAmber(d)} style={{ ...miniBtn(), padding: "7px 11px", fontSize: 11.5, borderColor: T.goldEdge, color: T.gold }}><Sparkle size={12} /> Ask Amber</button>
          </>}
        </div>
      </HotCard>
    );
  };

  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 };
  const tabs = isAdmin ? [["pending", "Pending", pending.length], ["board", "Approved", approved.length], ["all", "All deals", all.length]]
    : [["board", "Hot deals", approved.length], ["mine", "My submissions", mine.length]];
  const shown = tab === "pending" ? pending : tab === "mine" ? mine : tab === "all" ? all : approved;
  const framed = tab === "pending" ? shown : sortFeaturedNewest(shown.filter((d) => withinFrame(d.created_at, frame)));

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

    {tab !== "pending" && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
      <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 600 }}>{framed.length} {framed.length === 1 ? "deal" : "deals"}{frame === "week" ? " · this week" : frame === "month" ? " · this month" : ""} · featured & newest first</div>
      <FrameTabs value={frame} onChange={setFrame} />
    </div>}

    <div style={{ marginTop: 16 }}>
      {deals === null ? <div style={{ ...card, padding: 30, textAlign: "center", color: T.muted }}>Loading hot deals…</div>
        : framed.length === 0 ? <div style={{ ...card, padding: 40, textAlign: "center" }}>
            <Flame size={26} color={T.faint} style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700 }}>{shown.length > 0 && frame !== "all" ? (frame === "week" ? "No deals in this view from the last 7 days." : "No deals in this view from the last 31 days.") : tab === "pending" ? "No deals waiting for approval." : tab === "mine" ? "You haven't posted any hot deals yet." : "No approved hot deals yet."}</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>{shown.length > 0 && frame !== "all" ? "Switch to All to see everything." : isAdmin ? "Approved deals appear to the whole team." : "Tap Post Hot Deal to share an opportunity."}</div>
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
        : <div style={grid}>{framed.map((d) => <Card key={d.id} d={d} ownerView={tab === "mine" || (tab === "all" && isAdmin)} />)}</div>}
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
        cursor: "pointer", padding: 0, overflow: "hidden" }}>
        {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini}</button>
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
      <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: T.muted }}>Color theme</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        {ACCENTS.map(([key, label, dot]) => { const on = accent === key; return (
          <button key={key} onClick={() => setAccent(key)} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${on ? T.gold : T.hair}`, background: on ? T.goldSoft : T.paper, color: on ? T.gold : T.ink, borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>
            <span style={{ width: 15, height: 15, borderRadius: 5, background: dot, border: `1px solid ${T.hair}`, flexShrink: 0 }} />{label}{on && <Check size={13} style={{ marginLeft: "auto" }} />}
          </button>); })}
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
        <div style={{ fontSize: 12.5, margin: "14px 0 8px", color: T.muted }}>Color theme</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ACCENTS.map(([key, label, dot]) => { const on = accent === key; return (
            <button key={key} onClick={() => setAccent(key)} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${on ? T.gold : T.hair}`, background: on ? T.goldSoft : T.paper, color: on ? T.gold : T.ink, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: UI }}>
              <span style={{ width: 16, height: 16, borderRadius: 5, background: dot, border: `1px solid ${T.hair}`, flexShrink: 0 }} />{label}{on && <Check size={14} style={{ marginLeft: "auto" }} />}
            </button>); })}
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
  const [showBulk, setShowBulk] = useState(false);
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
        <button onClick={() => setShowBulk(true)} style={{ ...miniBtn() }}><Users size={13} /> Bulk import</button>
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
                  <Av name={u.full_name || u.email} src={u.avatar_url || undefined} size={30} dark round />
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
    {showBulk && <BulkImportUsers onClose={() => setShowBulk(false)} onDone={() => { setShowBulk(false); load(); }} />}
    {edit && <ManageUserModal u={edit} users={users} onClose={() => setEdit(null)} onChanged={() => { setEdit(null); load(); }} />}
  </div>;
}

function BulkImportUsers({ onClose, onDone }) {
  const DEFAULT = `ADNAN AHMED KHAN, adnan@amberhomes.ae, Agent
ALAN KURBANOV, ak@amberhomes.ae, Agent
ALI MOHSIN, ali@amberhomes.ae, Agent
ANKIT AGGARWAL, ankit@amberhomes.ae, Agent
ARSALAN RAUF, arsalan@amberhomes.ae, Agent
ASMA MOHAMMAD, asma@amberhomes.ae, Agent
Admin, admin@amberhomes.ae, Manager
BAPTISTE PARNEIX, baptiste@amberhomes.ae, Agent
BINOIA DZHURABAEVA, binoia@amberhomes.ae, Agent
DERYA ALTUN, derya@amberhomes.ae, Agent
FAZAL KHAN, fazal@amberhomes.ae, Agent
HASSAN MUGHAL, hmughal@amberhomes.ae, Agent
IBRAHIM QURESHI, ibrahimqureshi@amberhomes.ae, Manager
IRENE PRAVEEN, irene@amberhomes.ae, Agent
JAYESH NARYANI, jayesh@amberhomes.ae, Agent
KHOZHIAKBAR SADYKOV, khozhiakbar@amberhomes.ae, Agent
MADEL DICHOSO, madz@amberhomes.ae, Agent
MOHSIN FIROZ PATEL, mohsin@amberhomes.ae, Agent
MUAAZ MEHMOOD, muaaz@amberhomes.ae, Agent
MUEEZ MEHMOOD, mueez@amberhomes.ae, Agent
MUHAMMAD IBRAHIM, ibrahim@amberhomes.ae, Agent
MUHAMMAD ZOHAIB KHAN, mkhan@amberhomes.ae, Agent
RAMEESA NADEEM, rameesa@amberhomes.ae, Agent
ROHAIL QAISAR ABBAS, rohail@amberhomes.ae, Agent
SAIMIN ALTAF ZUBER, saimin@amberhomes.ae, Agent
SANA KHAN, sana@amberhomes.ae, Agent
SHIFA SHAMSHUDDIN, shifa@amberhomes.ae, Agent
SHILEN AJESH MEHTA, shil@amberhomes.ae, Agent
SYED QALB E ABBAS SHAH, abbas@amberhomes.ae, Agent
YASHVEER OMPRAKASH SWAMI, yashveer@amberhomes.ae, Agent
ZONISH BAIG, zonish@amberhomes.ae, Agent`;
  const [text, setText] = useState(DEFAULT);
  const [phase, setPhase] = useState("edit");
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState("");

  const normRole = (r) => { const s = (r || "").trim().toLowerCase();
    if (s.includes("manager")) return "sales_manager"; if (s === "admin") return "admin";
    if (s.includes("market")) return "marketing"; if (s.includes("account")) return "accounts"; return "agent"; };
  const parse = (txt) => txt.split("\n").map((line) => {
    const parts = line.split(",").map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    const emailIdx = parts.findIndex((p) => p.includes("@"));
    const email = (emailIdx >= 0 ? parts[emailIdx] : parts[1] || "").toLowerCase();
    const role = normRole(parts[parts.length - 1]);
    const name = (emailIdx > 0 ? parts.slice(0, emailIdx).join(" ") : parts[0]).trim();
    return { name, email, role };
  }).filter(Boolean);
  const genPw = () => "Amber" + Math.random().toString(36).slice(2, 8) + Math.floor(10 + Math.random() * 89) + "!";
  const roleName = (r) => ({ sales_manager: "Manager", admin: "Admin", agent: "Agent", marketing: "Marketing", accounts: "Accounts" }[r] || r);

  const run = async () => {
    setPhase("running"); setResults([]);
    const parsed = parse(text);
    const seen = new Set(); const out = []; const targets = [];
    for (const t of parsed) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t.email)) { out.push({ ...t, action: "invalid email — skipped" }); continue; }
      if (t.email === MASTER_ADMIN_EMAIL) { out.push({ ...t, action: "skipped — Master Admin protected" }); continue; }
      if (seen.has(t.email)) { out.push({ ...t, action: "duplicate in list — skipped" }); continue; }
      seen.add(t.email); targets.push(t);
    }
    setResults([...out]);
    const lu = await adminCall("list_users", {});
    if (lu.error) { setResults([...out, { name: "", email: "", role: "", action: "ERROR loading users: " + lu.error }]); setPhase("done"); return; }
    const existing = Object.fromEntries((lu.users || []).map((u) => [(u.email || "").toLowerCase(), u]));
    let done = 0;
    for (const t of targets) {
      setProgress("Processing " + (done + 1) + " of " + targets.length + "…");
      const ex = existing[t.email];
      if (ex) {
        if (ex.role === "master_admin") { out.push({ ...t, action: "skipped — Master Admin protected" }); setResults([...out]); done++; continue; }
        const changes = [];
        if (t.role && ex.role !== t.role) {
          const r = await adminCall("set_role", { id: ex.id, role: t.role, oldRole: ex.role });
          if (r.error) { out.push({ ...t, action: "error: " + r.error }); setResults([...out]); done++; continue; }
          changes.push("role " + (ex.role || "?") + " → " + roleName(t.role));
        }
        const fields = { twofa_required: true };
        if (t.name && ex.full_name !== t.name) { fields.full_name = t.name; changes.push("name updated"); }
        if (ex.active === false) { fields.active = true; changes.push("reactivated"); }
        const r2 = await adminCall("update_user", { id: ex.id, fields });
        if (r2.error) { out.push({ ...t, action: "error: " + r2.error }); setResults([...out]); done++; continue; }
        changes.push("2FA ensured");
        out.push({ ...t, action: "updated (" + changes.join(", ") + ")" });
      } else {
        const pw = genPw();
        const r = await adminCall("create_user", { email: t.email, password: pw, full_name: t.name, role: t.role, twofa: true, status: "active" });
        if (r.error) out.push({ ...t, action: "error: " + r.error });
        else out.push({ ...t, action: "created", password: pw });
      }
      setResults([...out]); done++;
    }
    setProgress(""); setPhase("done");
  };

  const created = results.filter((r) => r.action === "created");
  const cnt = (f) => results.filter(f).length;
  const copyAll = () => { const txt = created.map((r) => r.email + "  " + r.password).join("\n");
    if (navigator.clipboard) navigator.clipboard.writeText("Amber Homes CRM logins (temporary passwords — change on first login):\n\n" + txt); };
  const tone = (a) => a === "created" ? T.ok : a.startsWith("updated") ? T.gold : (a.startsWith("error") || a.startsWith("ERROR")) ? T.bad : T.muted;

  return <Modal title="Bulk import users" onClose={onClose}>
    {phase === "edit" && <>
      <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55, marginBottom: 10 }}>
        One user per line as <b>Name, email, Role</b> (Role = Agent or Manager). Emails are lowercased automatically.
        Existing users are updated, never duplicated; <b>saad@amberhomes.ae</b> is always protected. New users get a
        secure temporary password and must change it at first login, with 2FA required.</div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false}
        style={{ width: "100%", height: 200, border: `1px solid ${T.hair}`, borderRadius: 10, padding: 12, fontSize: 12,
          fontFamily: "monospace", color: T.ink, background: T.bone, boxSizing: "border-box", resize: "vertical" }} />
      <div style={{ fontSize: 11, color: T.faint, marginTop: 6 }}>“Manager” maps to Sales Manager (team reporting and dashboards; not Master Admin, no user management).</div>
      <button onClick={run} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none", borderRadius: 10,
        padding: 12, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, marginTop: 12 }}>
        Create / update {parse(text).length} users</button>
    </>}

    {phase !== "edit" && <>
      {phase === "running" && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 10, fontWeight: 600 }}>{progress || "Working…"}</div>}
      {phase === "done" && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
        <b>{created.length}</b> created · <b>{cnt((r) => r.action.startsWith("updated"))}</b> updated ·
        <b> {cnt((r) => r.action.includes("skipped"))}</b> skipped ·
        <b> {cnt((r) => r.action.startsWith("error") || r.action.startsWith("ERROR"))}</b> errors.
        {created.length > 0 && <span> Temporary passwords are shown once below — copy them now.</span>}</div>}
      <div style={{ ...card, padding: 0, maxHeight: 320, overflowY: "auto" }}>
        {results.map((r, i) => <div key={i} style={{ padding: "8px 12px", borderTop: i ? `1px solid ${T.hairSoft}` : "none", fontSize: 12 }}>
          <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.email || r.name || "—"}</div>
          <div style={{ fontSize: 11, color: tone(r.action), fontWeight: 600 }}>{r.action}{r.password ? "  ·  " + r.password : ""}</div>
        </div>)}
      </div>
      {phase === "done" && created.length > 0 && <button onClick={copyAll}
        style={{ ...miniBtn(), width: "100%", justifyContent: "center", marginTop: 10 }}>Copy all new credentials</button>}
      {phase === "done" && <button onClick={onDone} style={{ width: "100%", background: T.btnBg, color: T.btnFg, border: "none",
        borderRadius: 10, padding: 12, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: UI, marginTop: 8 }}>Done</button>}
    </>}
  </Modal>;
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
