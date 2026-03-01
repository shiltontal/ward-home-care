import { useState, useEffect, useCallback } from "react";
import { dbRead, dbWrite, dbListen, isFirebaseReady } from "./firebase.js";

// ===================== CONSTANTS =====================
const CONTACT_METHODS = ["טלפון", "וידאו", "הודעה"];
const DAYS_HEB = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const CONTACT_TYPES = [
  { id: "morning", label: "שיחת בוקר", time: "08:30", icon: "🌅", color: "#f59e0b", role: "counselor" },
  { id: "evening", label: "שיחת ערב", time: "19:30", icon: "🌆", color: "#8b5cf6", role: "counselor" },
  { id: "nursing", label: "מעקב סיעודי", time: "20:30", icon: "🩺", color: "#ef4444", role: "nurse" },
  { id: "professional", label: "צוות מקצועי", time: "", icon: "👩‍⚕️", color: "#0ea5e9", role: "professional" },
];

const STAFF_ROLES = [
  { id: "doctor", label: "רופא/ה", icon: "🧠", fixed: true, color: "#6366f1", professional: true },
  { id: "psychologist", label: "פסיכולוג/ית", icon: "🔮", fixed: true, color: "#8b5cf6", professional: true },
  { id: "ot", label: "מרפאה בעיסוק", icon: "🎨", fixed: true, color: "#0ea5e9", professional: true },
  { id: "slp", label: 'קל"ת', icon: "🗣️", fixed: true, color: "#14b8a6", professional: true },
  { id: "behaviorist", label: "ניתוח התנהגות", icon: "📊", fixed: true, color: "#f97316", professional: true },
  { id: "dietitian", label: "דיאטנית", icon: "🥗", fixed: true, color: "#22c55e", professional: true },
  { id: "art_therapist", label: "טיפול באומנות", icon: "🖌️", fixed: true, color: "#ec4899", professional: true },
  { id: "social_worker", label: 'עו"ס', icon: "🤲", fixed: true, color: "#64748b", professional: true },
  { id: "family_companion", label: "מלווה משפחתית", icon: "👩‍👧", fixed: true, color: "#a855f7", professional: true },
  { id: "volunteer", label: "בת שירות", icon: "⭐", fixed: false, color: "#fbbf24", professional: true },
  { id: "research", label: "מחקר", icon: "🔬", fixed: true, color: "#0d9488", professional: true },
  { id: "nurse", label: "אח/ות", icon: "💉", fixed: false, color: "#ef4444", professional: false },
  { id: "counselor", label: "מדריך/ה", icon: "🤝", fixed: false, color: "#f59e0b", professional: false },
];

const PROFESSIONAL_STAFF = {
  ot: ["מירנדה", "רוני", "הדסי"],
  slp: ["ענת"],
  family_companion: ["שיר"],
  doctor: ["טל", "מריאלה", "נתן", "לירן", "רחל"],
  social_worker: ["מיכל"],
  art_therapist: ["ליאת"],
  psychologist: ["עמרי", "דנה", "רוית", "שיר גבאי", "שיר בן פורת", "עומר", "מיכל"],
  volunteer: ["ליאור ב.", "ליאור ג.", "שחף", "טליה", "נעמי", "יהב"],
  behaviorist: ["ויקי"],
  dietitian: ["בתיה"],
  research: [],
};

const PROFESSIONAL_ROLES = STAFF_ROLES.filter(r => r.professional);

const TOKEN_TYPES = [
  { id: "growth", label: "מטרת צמיחה", icon: "🎯", color: "#22c55e" },
  { id: "adl", label: "מטרת ADL", icon: "🏠", color: "#0ea5e9" },
  { id: "home", label: "מטרת בית", icon: "🏡", color: "#f59e0b" },
];

const COUNSELORS = ["ירדן", "גל", "טל", "עדי", "הילה", "תומר", "מאי", "רועי", "רן", "עפרי", "סול", "אוראל", "שיראל"];
const NURSES = ["נתי", "שגיא", "דוראל", "אליסיה", "נדא", "עוביידא", "אטי", "מאיה", "אנה"];

const INITIAL_PATIENTS = [
  { id: "p1", name: "ליאורי", shift: "רביעי", staff: { doctor: "לבי", psychologist: "רוית", ot: "מירנדה", slp: "ענת", behaviorist: "", dietitian: "בתיה", art_therapist: "", nurse: "נתי", counselor: "ירדן" }},
  { id: "p2", name: "אייל", shift: "רביעי", staff: { doctor: "טל", psychologist: "רוית", ot: "חוני", slp: "", behaviorist: "ויקי", dietitian: "בתיה", art_therapist: "שגיא", nurse: "ליאת", counselor: "גל" }},
  { id: "p3", name: "מיכאל", shift: "רביעי", staff: { doctor: "חגל", psychologist: "דנה", ot: "חוני", slp: "ענת", behaviorist: "", dietitian: "בתיה", art_therapist: "", nurse: "נתי", counselor: "טל" }},
  { id: "p4", name: "אריאל", shift: "רביעי", staff: { doctor: "רחל", psychologist: "עומר", ot: "הדסי", slp: "", behaviorist: "", dietitian: "", art_therapist: "ליאת", nurse: "דוראל", counselor: "עדי" }},
  { id: "p5", name: "נהוראי", shift: "שלישי", staff: { doctor: "ליין", psychologist: "שיר גבאי", ot: "הדסי", slp: "ענת", behaviorist: "ויקי", dietitian: "", art_therapist: "ליאת", nurse: "אליסיה", counselor: "הילה" }},
  { id: "p6", name: "שיר הלל", shift: "רביעי", staff: { doctor: "טל", psychologist: "עומר", ot: "מירנדה", slp: "", behaviorist: "", dietitian: "בתיה", art_therapist: "ליאת", nurse: "שגיא", counselor: "תומר" }},
  { id: "p7", name: "יובל", shift: "שלישי", staff: { doctor: "חגל", psychologist: "שיר בן פורת", ot: "הדסי", slp: "", behaviorist: "", dietitian: "בתיה", art_therapist: "ליאת", nurse: "נדא", counselor: "מאי" }},
  { id: "p8", name: "עילאי", shift: "רביעי", staff: { doctor: "חגל", psychologist: "עומר", ot: "חוני", slp: "ענת", behaviorist: "", dietitian: "", art_therapist: "", nurse: "עוביידא", counselor: "רועי" }},
  { id: "p9", name: "ליבי", shift: "שלישי", staff: { doctor: "ליין", psychologist: "שיר בן פורת", ot: "חוני", slp: "", behaviorist: "", dietitian: "", art_therapist: "ליאת", nurse: "אטי", counselor: "רן" }},
  { id: "p10", name: "מאיה", shift: "רביעי", staff: { doctor: "ליבי", psychologist: "שיר בן פורת", ot: "מירנדה", slp: "ענת", behaviorist: "", dietitian: "בתיה", art_therapist: "", nurse: "מאיה", counselor: "עפרי" }},
  { id: "p11", name: "אלקנה", shift: "רביעי", staff: { doctor: "ליין", psychologist: "רוית", ot: "חוני", slp: "", behaviorist: "", dietitian: "", art_therapist: "", nurse: "אנה", counselor: "סול" }},
  { id: "p12", name: "יהונתן", shift: "שלישי", staff: { doctor: "טל", psychologist: "שיר גבאי", ot: "הדסי", slp: "", behaviorist: "", dietitian: "בתיה", art_therapist: "", nurse: "דוראל", counselor: "אוראל" }},
  { id: "p13", name: "ליהי", shift: "רביעי", staff: { doctor: "מריאלה", psychologist: "מיכל", ot: "מירנדה", slp: "", behaviorist: "", dietitian: "בתיה", art_therapist: "", nurse: "אליסיה", counselor: "" }},
  { id: "p14", name: "שילי", shift: "שלישי", staff: { doctor: "נתן", psychologist: "שיר גבאי", ot: "חוני", slp: "", behaviorist: "", dietitian: "", art_therapist: "", nurse: "", counselor: "שיראל" }},
  { id: "p15", name: "ירדן", shift: "שלישי", staff: { doctor: "מריאלה", psychologist: "עמרי", ot: "הדסי", slp: "ענת", behaviorist: "", dietitian: "בתיה", art_therapist: "", nurse: "נתי", counselor: "" }},
].map(p => ({
  ...p, age: "", notes: "",
  currentGoals: { growth: "", adl: "", home: "" },
  tokens: { growth: 0, adl: 0, home: 0 },
  weeklySchedule: {},
}));

// ===================== STORAGE =====================
const SK = { patients: "ward-patients-v4", contacts: "ward-contacts-v4", staffList: "ward-staff-v4", staffUpdates: "ward-updates-v4", tasks: "ward-tasks-v4" };
async function load(key, fb) { try { const r = await dbRead(key); return r != null ? r : fb; } catch { return fb; } }
async function sav(key, data) { try { await dbWrite(key, data); } catch (e) { console.error(e); } }

// ===================== HELPERS =====================
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = d => d ? new Date(d).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }) : "";
const fmtTime = d => d ? new Date(d).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "";
const timeSince = d => { if (!d) return "—"; const h = Math.floor((Date.now() - new Date(d).getTime()) / 36e5); if (h < 1) return "עכשיו"; if (h < 24) return `${h}ש`; const days = Math.floor(h / 24); return days === 1 ? "אתמול" : `${days}י`; };
const totalTokens = t => { if (!t || typeof t === "number") return t || 0; return (t.growth || 0) + (t.adl || 0) + (t.home || 0); };

// ===================== UI =====================
const CL = { bg: "#f0f4f8", card: "#fff", pri: "#1a365d", priL: "#2c5282", brd: "#e2e8f0", txt: "#1a202c", txtM: "#4a5568", txtL: "#a0aec0", ok: "#38a169", warn: "#d69e2e", err: "#e53e3e" };

function Badge({ children, bg = "#edf2f7", color = "#4a5568", style }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color, whiteSpace: "nowrap", ...style }}>{children}</span>;
}
function Btn({ children, onClick, v = "primary", sm, disabled, full, style }) {
  const S = { primary: { bg: CL.pri, c: "#fff" }, accent: { bg: CL.accent, c: "#fff" }, secondary: { bg: "#edf2f7", c: CL.pri }, danger: { bg: "#fed7d7", c: CL.err }, ghost: { bg: "transparent", c: CL.priL }, success: { bg: "#c6f6d5", c: "#276749" } };
  const s = S[v] || S.primary;
  return <button onClick={onClick} disabled={disabled} style={{ border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .15s", opacity: disabled ? .5 : 1, padding: sm ? "5px 10px" : "9px 18px", fontSize: sm ? 12 : 13, background: s.bg, color: s.c, width: full ? "100%" : "auto", ...style }}>{children}</button>;
}
function Card({ children, style, onClick, accent }) {
  return <div onClick={onClick} style={{ background: CL.card, borderRadius: 12, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,.05)", border: `1px solid ${CL.brd}`, borderRight: accent ? `4px solid ${accent}` : undefined, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>;
}
function Inp({ value, onChange, placeholder, type = "text", style, ...rest }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${CL.brd}`, fontFamily: "inherit", fontSize: 13, width: "100%", boxSizing: "border-box", direction: "rtl", ...style }} {...rest} />;
}
function Sel({ value, onChange, options, placeholder, style, dark }) {
  const baseStyle = { padding: "7px 10px", borderRadius: 7, border: `1px solid ${CL.brd}`, fontFamily: "inherit", fontSize: 13, background: dark ? "#000" : "#fff", color: dark ? "#fff" : "inherit", direction: "rtl", ...style };
  return <select value={value} onChange={e => onChange(e.target.value)} style={baseStyle}>
    {placeholder && <option value="" style={dark ? { background: "#000", color: "#fff" } : {}}>{placeholder}</option>}
    {options.map(o => typeof o === "string" ? <option key={o} value={o} style={dark ? { background: "#000", color: "#fff" } : {}}>{o}</option> : <option key={o.value} value={o.value} style={dark ? { background: "#000", color: "#fff" } : {}}>{o.label}</option>)}
  </select>;
}
function TArea({ value, onChange, placeholder, rows = 2, style }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${CL.brd}`, fontFamily: "inherit", fontSize: 13, width: "100%", boxSizing: "border-box", direction: "rtl", resize: "vertical", ...style }} />;
}
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", padding: 16 }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: wide ? "95%" : "92%", maxWidth: wide ? 800 : 520, maxHeight: "88vh", overflow: "auto", direction: "rtl", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: CL.pri }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: CL.txtL }}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}



// ===================== SVG ANIMALS =====================
const animals = {
  lion: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="30" rx="22" ry="20" fill="#c2710c"/>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => <circle key={a} cx={32+Math.cos(a*Math.PI/180)*20} cy={30+Math.sin(a*Math.PI/180)*18} r={5} fill="#a85d08" opacity=".7"/>)}
      <ellipse cx="32" cy="32" rx="14" ry="13" fill="#e8a33c"/>
      <ellipse cx="26" cy="29" rx="2.5" ry="3" fill="#1a1a1a"/><ellipse cx="38" cy="29" rx="2.5" ry="3" fill="#1a1a1a"/>
      <circle cx="25.5" cy="28" r="1" fill="#fff"/><circle cx="37.5" cy="28" r="1" fill="#fff"/>
      <ellipse cx="32" cy="35" rx="3.5" ry="2.5" fill="#8B5E34"/>
      <path d="M29 37Q32 40 35 37" stroke="#8B5E34" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <ellipse cx="20" cy="20" rx="5" ry="4" fill="#c2710c"/><ellipse cx="20" cy="20" rx="3" ry="2.5" fill="#e8a33c"/>
      <ellipse cx="44" cy="20" rx="5" ry="4" fill="#c2710c"/><ellipse cx="44" cy="20" rx="3" ry="2.5" fill="#e8a33c"/>
    </svg>
  ),
  meerkat: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="38" rx="8" ry="10" fill="#c4a97d"/>
      <ellipse cx="24" cy="20" rx="9" ry="10" fill="#d4b896"/>
      <ellipse cx="20" cy="18" rx="4" ry="3.5" fill="#3d2b1f"/><ellipse cx="28" cy="18" rx="4" ry="3.5" fill="#3d2b1f"/>
      <circle cx="20" cy="18" r="2" fill="#1a1a1a"/><circle cx="28" cy="18" r="2" fill="#1a1a1a"/>
      <circle cx="19.5" cy="17.3" r=".8" fill="#fff"/><circle cx="27.5" cy="17.3" r=".8" fill="#fff"/>
      <ellipse cx="24" cy="23" rx="2" ry="1.5" fill="#1a1a1a"/>
      <ellipse cx="24" cy="38" rx="5" ry="7" fill="#e8dcc8"/>
    </svg>
  ),
  warthog: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="28" rx="14" ry="10" fill="#8b7355"/><ellipse cx="24" cy="24" rx="11" ry="10" fill="#a0896b"/>
      <ellipse cx="24" cy="29" rx="7" ry="5" fill="#c4a97d"/>
      <circle cx="21.5" cy="29" r="1.5" fill="#5c4a3a"/><circle cx="26.5" cy="29" r="1.5" fill="#5c4a3a"/>
      <circle cx="19" cy="22" r="2" fill="#1a1a1a"/><circle cx="29" cy="22" r="2" fill="#1a1a1a"/>
      <path d="M18 28Q15 24 17 21" stroke="#f0e8d8" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M30 28Q33 24 31 21" stroke="#f0e8d8" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M20 14Q24 8 28 14" stroke="#5c4a3a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  elephant: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="26" rx="14" ry="12" fill="#8fa4b0"/>
      <ellipse cx="24" cy="22" rx="12" ry="11" fill="#a3bcc8"/>
      <circle cx="19" cy="20" r="2" fill="#1a1a1a"/><circle cx="29" cy="20" r="2" fill="#1a1a1a"/>
      <circle cx="18.5" cy="19.3" r=".7" fill="#fff"/><circle cx="28.5" cy="19.3" r=".7" fill="#fff"/>
      <path d="M24 25Q22 32 20 38" stroke="#8fa4b0" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M12 18Q6 20 8 28" stroke="#a3bcc8" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M36 18Q42 20 40 28" stroke="#a3bcc8" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <ellipse cx="12" cy="18" rx="5" ry="6" fill="#a3bcc8"/>
      <ellipse cx="36" cy="18" rx="5" ry="6" fill="#a3bcc8"/>
    </svg>
  ),
  giraffe: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="21" y="8" width="6" height="22" rx="3" fill="#e8b84c"/>
      <circle cx="24" cy="10" r="7" fill="#edc860"/>
      <circle cx="21" cy="9" r="1.5" fill="#1a1a1a"/><circle cx="27" cy="9" r="1.5" fill="#1a1a1a"/>
      <circle cx="20.5" cy="8.5" r=".5" fill="#fff"/><circle cx="26.5" cy="8.5" r=".5" fill="#fff"/>
      <ellipse cx="24" cy="13" rx="2" ry="1" fill="#c49a2c"/>
      <line x1="22" y1="4" x2="21" y2="1" stroke="#c49a2c" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="26" y1="4" x2="27" y2="1" stroke="#c49a2c" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="21" cy="1" r="1.5" fill="#c49a2c"/><circle cx="27" cy="1" r="1.5" fill="#c49a2c"/>
      {[14,18,22,26].map(y => <><circle key={y+"l"} cx={22} cy={y} r="1.5" fill="#b07d20" opacity=".5"/><circle key={y+"r"} cx={26} cy={y} r="1.5" fill="#b07d20" opacity=".5"/></>)}
      <ellipse cx="24" cy="36" rx="10" ry="8" fill="#e8b84c"/>
    </svg>
  ),
  zebra: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="28" rx="14" ry="10" fill="#f0f0f0"/>
      <ellipse cx="24" cy="22" rx="10" ry="10" fill="#fff"/>
      {[16,20,24,28].map(y => <line key={y} x1="17" y1={y} x2="31" y2={y} stroke="#2d2d2d" strokeWidth="1.5" opacity=".6"/>)}
      <circle cx="20" cy="20" r="2" fill="#1a1a1a"/><circle cx="28" cy="20" r="2" fill="#1a1a1a"/>
      <ellipse cx="24" cy="27" rx="3" ry="2" fill="#aaa"/>
      <path d="M20 12Q24 6 28 12" stroke="#2d2d2d" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  hippo: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="28" rx="16" ry="12" fill="#9b7fb0"/>
      <ellipse cx="24" cy="22" rx="13" ry="11" fill="#b8a0c8"/>
      <ellipse cx="24" cy="28" rx="9" ry="6" fill="#c8b0d8"/>
      <circle cx="21" cy="28" r="2" fill="#9b7fb0"/><circle cx="27" cy="28" r="2" fill="#9b7fb0"/>
      <circle cx="19" cy="20" r="2.5" fill="#1a1a1a"/><circle cx="29" cy="20" r="2.5" fill="#1a1a1a"/>
      <circle cx="18.5" cy="19.2" r=".8" fill="#fff"/><circle cx="28.5" cy="19.2" r=".8" fill="#fff"/>
      <ellipse cx="15" cy="16" rx="4" ry="3" fill="#b8a0c8"/>
      <ellipse cx="33" cy="16" rx="4" ry="3" fill="#b8a0c8"/>
    </svg>
  ),
  monkey: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="13" fill="#8B6534"/>
      <ellipse cx="24" cy="28" rx="8" ry="7" fill="#d4b896"/>
      <circle cx="19" cy="22" r="2.5" fill="#1a1a1a"/><circle cx="29" cy="22" r="2.5" fill="#1a1a1a"/>
      <circle cx="18.5" cy="21.3" r=".8" fill="#fff"/><circle cx="28.5" cy="21.3" r=".8" fill="#fff"/>
      <ellipse cx="24" cy="28" rx="3" ry="2" fill="#c4a07d"/>
      <path d="M22 30Q24 33 26 30" stroke="#8B6534" strokeWidth="1" fill="none"/>
      <circle cx="11" cy="22" r="5" fill="#8B6534"/><circle cx="11" cy="22" r="3" fill="#d4b896"/>
      <circle cx="37" cy="22" r="5" fill="#8B6534"/><circle cx="37" cy="22" r="3" fill="#d4b896"/>
    </svg>
  ),
  parrot: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="28" rx="10" ry="14" fill="#22c55e"/>
      <circle cx="24" cy="18" r="10" fill="#4ade80"/>
      <circle cx="20" cy="16" r="2" fill="#1a1a1a"/><circle cx="28" cy="16" r="2" fill="#1a1a1a"/>
      <circle cx="19.5" cy="15.3" r=".7" fill="#fff"/><circle cx="27.5" cy="15.3" r=".7" fill="#fff"/>
      <path d="M24 20L21 24L24 22L27 24Z" fill="#f59e0b"/>
      <ellipse cx="18" cy="30" rx="4" ry="8" fill="#16a34a" transform="rotate(-15 18 30)"/>
      <ellipse cx="30" cy="30" rx="4" ry="8" fill="#16a34a" transform="rotate(15 30 30)"/>
      <path d="M22 8Q24 2 26 8" fill="#ef4444"/>
    </svg>
  ),
  turtle: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="28" rx="16" ry="10" fill="#2d8a4e"/>
      <ellipse cx="24" cy="26" rx="14" ry="9" fill="#3da862"/>
      <path d="M18 22L24 18L30 22L27 28L21 28Z" fill="#2d8a4e" opacity=".5"/>
      <circle cx="24" cy="18" r="6" fill="#8bc9a0"/>
      <circle cx="22" cy="17" r="1.5" fill="#1a1a1a"/><circle cx="26" cy="17" r="1.5" fill="#1a1a1a"/>
      <path d="M22 20Q24 22 26 20" stroke="#2d8a4e" strokeWidth="1" fill="none"/>
      <ellipse cx="12" cy="30" rx="3" ry="2" fill="#8bc9a0"/>
      <ellipse cx="36" cy="30" rx="3" ry="2" fill="#8bc9a0"/>
    </svg>
  ),
  fox: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="28" rx="12" ry="10" fill="#e87040"/>
      <ellipse cx="24" cy="24" rx="11" ry="11" fill="#f0924c"/>
      <path d="M14 22L10 8L18 18Z" fill="#f0924c"/><path d="M34 22L38 8L30 18Z" fill="#f0924c"/>
      <path d="M14 22L12 10L17 18Z" fill="#e87040"/><path d="M34 22L36 10L31 18Z" fill="#e87040"/>
      <ellipse cx="24" cy="28" rx="6" ry="5" fill="#fff"/>
      <circle cx="20" cy="22" r="2" fill="#1a1a1a"/><circle cx="28" cy="22" r="2" fill="#1a1a1a"/>
      <ellipse cx="24" cy="27" rx="2" ry="1.5" fill="#1a1a1a"/>
    </svg>
  ),
  owl: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="28" rx="14" ry="14" fill="#8B6534"/>
      <ellipse cx="24" cy="26" rx="12" ry="12" fill="#a07850"/>
      <circle cx="19" cy="22" r="5" fill="#fff"/><circle cx="29" cy="22" r="5" fill="#fff"/>
      <circle cx="19" cy="22" r="3" fill="#f59e0b"/><circle cx="29" cy="22" r="3" fill="#f59e0b"/>
      <circle cx="19" cy="22" r="1.5" fill="#1a1a1a"/><circle cx="29" cy="22" r="1.5" fill="#1a1a1a"/>
      <path d="M22 28L24 31L26 28" fill="#c49a2c"/>
      <path d="M14 14L19 18" stroke="#8B6534" strokeWidth="2"/><path d="M34 14L29 18" stroke="#8B6534" strokeWidth="2"/>
      <ellipse cx="24" cy="34" rx="7" ry="5" fill="#c4a97d"/>
    </svg>
  ),
  rabbit: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="30" rx="12" ry="12" fill="#e0d0c0"/>
      <rect x="18" y="4" width="4" height="18" rx="2" fill="#e0d0c0"/><rect x="26" y="4" width="4" height="18" rx="2" fill="#e0d0c0"/>
      <rect x="19" y="6" width="2" height="14" rx="1" fill="#f0b0b0"/><rect x="27" y="6" width="2" height="14" rx="1" fill="#f0b0b0"/>
      <circle cx="20" cy="26" r="2" fill="#1a1a1a"/><circle cx="28" cy="26" r="2" fill="#1a1a1a"/>
      <circle cx="19.5" cy="25.3" r=".7" fill="#fff"/><circle cx="27.5" cy="25.3" r=".7" fill="#fff"/>
      <ellipse cx="24" cy="31" rx="2" ry="1.5" fill="#f0b0b0"/>
      <line x1="14" y1="30" x2="8" y2="28" stroke="#ccc" strokeWidth="1"/><line x1="14" y1="32" x2="8" y2="33" stroke="#ccc" strokeWidth="1"/>
      <line x1="34" y1="30" x2="40" y2="28" stroke="#ccc" strokeWidth="1"/><line x1="34" y1="32" x2="40" y2="33" stroke="#ccc" strokeWidth="1"/>
    </svg>
  ),
  bear: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="26" r="14" fill="#7a5c3a"/>
      <circle cx="14" cy="14" r="5" fill="#7a5c3a"/><circle cx="14" cy="14" r="3" fill="#a07850"/>
      <circle cx="34" cy="14" r="5" fill="#7a5c3a"/><circle cx="34" cy="14" r="3" fill="#a07850"/>
      <ellipse cx="24" cy="30" rx="7" ry="5" fill="#c4a97d"/>
      <circle cx="20" cy="24" r="2" fill="#1a1a1a"/><circle cx="28" cy="24" r="2" fill="#1a1a1a"/>
      <ellipse cx="24" cy="29" rx="3" ry="2" fill="#5c4a3a"/>
    </svg>
  ),
  gazelle: ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="30" rx="12" ry="9" fill="#d4a24c"/>
      <ellipse cx="24" cy="22" rx="8" ry="8" fill="#e8b84c"/>
      <circle cx="21" cy="20" r="2" fill="#1a1a1a"/><circle cx="27" cy="20" r="2" fill="#1a1a1a"/>
      <circle cx="20.5" cy="19.3" r=".7" fill="#fff"/><circle cx="26.5" cy="19.3" r=".7" fill="#fff"/>
      <ellipse cx="24" cy="25" rx="2" ry="1" fill="#c49a2c"/>
      <path d="M19 14Q17 4 15 2" stroke="#8B6534" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M29 14Q31 4 33 2" stroke="#8B6534" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="16" cy="16" rx="3" ry="4" fill="#e8b84c"/><ellipse cx="32" cy="16" rx="3" ry="4" fill="#e8b84c"/>
    </svg>
  ),
};

const ANIMAL_KEYS = ["lion","elephant","giraffe","fox","owl","monkey","parrot","turtle","zebra","bear","rabbit","hippo","meerkat","gazelle","warthog"];
const getAnimal = (idx) => { const key = ANIMAL_KEYS[idx % ANIMAL_KEYS.length]; return animals[key]; };

// ===================== SVG SCENES =====================
const SvgSunrise = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#fef3c7"/>
    <path d="M0 34Q8 22 16 28Q24 18 32 26Q40 20 48 34L48 48L0 48Z" fill="#4ade80" opacity=".4"/>
    <path d="M0 36Q10 26 20 32Q30 24 40 30Q44 28 48 36L48 48L0 48Z" fill="#22c55e" opacity=".5"/>
    <circle cx="24" cy="24" r="8" fill="#f59e0b"/>
    <circle cx="24" cy="24" r="5" fill="#fbbf24"/>
    {[0,45,90,135,180,225,270,315].map(a => <line key={a} x1={24+Math.cos(a*Math.PI/180)*10} y1={24+Math.sin(a*Math.PI/180)*10} x2={24+Math.cos(a*Math.PI/180)*13} y2={24+Math.sin(a*Math.PI/180)*13} stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>)}
    <path d="M6 38L14 24L22 34L30 20L38 30L44 38Z" fill="#6366f1" opacity=".2"/>
  </svg>
);

const SvgSunsetSea = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#1e1b4b"/>
    <rect y="28" width="48" height="20" rx="0" fill="#312e81" opacity=".5"/>
    <circle cx="24" cy="22" r="8" fill="#f97316" opacity=".8"/>
    <circle cx="24" cy="22" r="5" fill="#fb923c"/>
    <rect x="16" y="22" width="16" height="2" fill="#f97316" opacity=".3"/>
    <path d="M0 32Q6 29 12 32Q18 35 24 32Q30 29 36 32Q42 35 48 32L48 48L0 48Z" fill="#3b82f6" opacity=".4"/>
    <path d="M0 36Q8 33 16 36Q24 39 32 36Q40 33 48 36L48 48L0 48Z" fill="#2563eb" opacity=".5"/>
    <line x1="18" y1="30" x2="30" y2="30" stroke="#f97316" strokeWidth="1" opacity=".3"/>
    <line x1="20" y1="34" x2="28" y2="34" stroke="#f97316" strokeWidth=".5" opacity=".2"/>
  </svg>
);

const SvgPastoralHouse = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#ecfdf5"/>
    <rect y="34" width="48" height="14" fill="#86efac" opacity=".5"/>
    <path d="M8 28L24 14L40 28Z" fill="#ef4444" opacity=".8"/>
    <rect x="14" y="28" width="20" height="14" fill="#fef3c7"/>
    <rect x="20" y="32" width="8" height="10" fill="#92400e" opacity=".6"/>
    <rect x="16" y="30" width="5" height="5" fill="#bfdbfe" opacity=".8"/>
    <rect x="27" y="30" width="5" height="5" fill="#bfdbfe" opacity=".8"/>
    <circle cx="37" cy="16" r="4" fill="#fbbf24" opacity=".6"/>
    <path d="M4 38Q6 34 8 38" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
    <path d="M40 36Q42 32 44 36" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="10" cy="22" rx="5" ry="4" fill="#86efac" opacity=".4"/>
    <ellipse cx="38" cy="24" rx="4" ry="3" fill="#86efac" opacity=".3"/>
  </svg>
);

const SvgSunsetBg = () => (
  <svg width="100%" height="100" viewBox="0 0 500 100" preserveAspectRatio="none" style={{ position: "absolute", bottom: 0, left: 0, right: 0, opacity: 0.08 }}>
    <circle cx="375" cy="40" r="25" fill="#93c5fd" opacity=".4"/>
    <path d="M0 65Q60 50 120 60Q200 70 280 55Q360 45 420 58Q460 65 500 60L500 100L0 100Z" fill="#1e3a5f" opacity=".3"/>
    <path d="M0 75Q80 65 160 72Q240 80 320 70Q400 62 500 75L500 100L0 100Z" fill="#1e293b" opacity=".2"/>
  </svg>
);

const SvgPaw = ({ size = 16, color = "#22c55e", opacity = 0.15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity={opacity}>
    <ellipse cx="12" cy="16" rx="5" ry="4"/><circle cx="7" cy="10" r="2.5"/><circle cx="17" cy="10" r="2.5"/>
    <circle cx="4.5" cy="14" r="2"/><circle cx="19.5" cy="14" r="2"/>
  </svg>
);

// ===================== DASHBOARD =====================
const dashCSS = `
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
@keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08); } }
@keyframes ringFill { from { stroke-dashoffset:251; } }
@keyframes glowPulse { 0%,100% { box-shadow:0 0 8px rgba(44,82,130,0.1); } 50% { box-shadow:0 0 20px rgba(44,82,130,0.2); } }
@keyframes heroAnimal { from { opacity:0; transform:translateY(10px) scale(0.9); } to { opacity:1; transform:translateY(0) scale(1); } }
.dash-card { animation: fadeSlideUp 0.4s ease both; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.dash-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(30,58,95,0.08) !important; }
.child-card { animation: fadeSlideUp 0.4s ease both; transition: transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s ease; cursor: pointer; }
.child-card:hover { transform: translateY(-4px) scale(1.015); box-shadow: 0 12px 32px rgba(30,58,95,0.12) !important; }
.task-row { transition: background 0.15s ease; } .task-row:hover { background: #fef2f2 !important; }
.feed-row { transition: background 0.15s ease, padding-right 0.15s ease; } .feed-row:hover { background: #f0f7ff !important; padding-right: 14px !important; }
.stat-ring { animation: ringFill 1.2s ease both; }
.needs-attention { animation: glowPulse 2.5s ease-in-out infinite; }
.hero-animal { animation: heroAnimal 0.8s ease both; }
`;

function CircularProgress({ value, max, size = 64, stroke = 5, color, children }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ * (1 - (max > 0 ? Math.min(value / max, 1) : 0));
  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle className="stat-ring" cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>{children}</div>
    </div>
  );
}

function Dashboard({ patients, contacts, tasks, onSelect, onResolveTask }) {
  const td = today();
  const todayC = contacts.filter(c => c.date === td);
  const hour = new Date().getHours();
  const getStatus = p => { const pc = todayC.filter(c => c.childId === p.id); return { morning: pc.some(c => c.type === "morning"), evening: pc.some(c => c.type === "evening"), nursing: pc.some(c => c.type === "nursing") }; };
  const needsAttention = patients.filter(p => { const s = getStatus(p); return (hour >= 10 && !s.morning) || (hour >= 20 && !s.evening) || (hour >= 21 && !s.nursing); });
  const lastContact = pid => contacts.filter(c => c.childId === pid).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  const openTasks = tasks.filter(t => !t.resolved);
  const morningDone = todayC.filter(c => c.type === "morning").length;
  const eveningDone = todayC.filter(c => c.type === "evening").length;
  const nursingDone = todayC.filter(c => c.type === "nursing").length;
  const totalContacts = todayC.length;
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";

  const NAT = { deep: "#1e3a5f", mid: "#2c5282", accent: "#5b8dca", warm: "#f0f7ff", warmD: "#dbeafe", peach: "#bfdbfe", sky: "#93c5fd", skyD: "#60a5fa", blue: "#3b82f6" };

  const stats = [
    { label: "שיחות בוקר", val: morningDone, max: patients.length, color: "#f59e0b", Scene: SvgSunrise },
    { label: "שיחות ערב", val: eveningDone, max: patients.length, color: "#6366f1", Scene: SvgSunsetSea },
    { label: "מעקב סיעודי", val: nursingDone, max: patients.length, color: "#ef4444", Scene: SvgPastoralHouse },
  ];
  const recentContacts = [...contacts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

  return (
    <>
      <style>{dashCSS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Heebo', 'Segoe UI', sans-serif" }}>

        {/* ====== HERO ====== */}
        <div className="dash-card" style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 30%, #3b6fb5 60%, #5b8dca 85%, #93c5fd 100%)",
          borderRadius: 18, padding: "28px 28px 20px", color: "#fff", position: "relative", overflow: "hidden",
          boxShadow: "0 8px 32px rgba(30,58,95,0.25)",
        }}>
          <SvgSunsetBg />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 300, letterSpacing: 1 }}>{greeting} 👋</div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 2, letterSpacing: -0.5, textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>בבית עם הלב של המחלקה</div>
                <div style={{ marginTop: 6, fontSize: 15, fontWeight: 300, fontStyle: "italic", opacity: 0.85, letterSpacing: 0.5 }}>
                  🌿 HAKUNA MATATA 🌿
                </div>
              </div>
              <div className="hero-animal" style={{ animationDelay: "0.3s", marginTop: -4, fontSize: 52 }}>🏠</div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 18, flexWrap: "wrap" }}>
              {[
                { val: patients.length, label: "ילדים", emoji: "👧🏻" },
                { val: totalContacts, label: "קשרים היום", emoji: "📞" },
                { val: openTasks.length, label: "משימות", emoji: openTasks.length > 0 ? "📌" : "✅", alert: openTasks.length > 0 },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 12, padding: "10px 18px", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center", minWidth: 70 }}>
                  <div style={{ fontSize: 10, marginBottom: 2 }}>{s.emoji}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: s.alert ? "#fca5a5" : "#fff" }}>{s.val}</div>
                  <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ====== TASKS ====== */}
        {openTasks.length > 0 && (
          <div className="dash-card" style={{ background: "linear-gradient(135deg, #fef2f2, #fff1f2)", borderRadius: 14, padding: "16px 20px", border: "1px solid #fecaca", animationDelay: "0.05s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #ef4444, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", boxShadow: "0 2px 8px rgba(239,68,68,0.3)" }}>📌</div>
              <div><div style={{ fontWeight: 700, color: "#991b1b", fontSize: 14 }}>בקשות לשיחה עם צוות מקצועי</div><div style={{ fontSize: 11, color: "#b91c1c" }}>{openTasks.length} משימות</div></div>
            </div>
            {openTasks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(task => {
              const p = patients.find(x => x.id === task.childId); const role = STAFF_ROLES.find(r => r.id === task.targetRole);
              return (
                <div key={task.id} className="task-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff", borderRadius: 10, border: "1px solid #fee2e2", marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "pulse 2s ease infinite" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: CL.pri, fontSize: 13 }}>{p?.name}</span><span style={{ color: CL.txtM }}>→</span>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${role?.color}12`, color: role?.color }}>{role?.icon} {task.targetName}</span>
                    </div>
                    {task.reason && <div style={{ fontSize: 11, color: CL.txtM, marginTop: 2 }}>{task.reason}</div>}
                    <div style={{ fontSize: 10, color: CL.txtL, marginTop: 1 }}>{task.requesterName} · {fmtDate(task.timestamp)}</div>
                  </div>
                  <button onClick={() => onResolveTask(task.id)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(34,197,94,0.3)" }}>✓</button>
                </div>
              );
            })}
          </div>
        )}


        {/* ====== PROGRESS WITH SCENES ====== */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {stats.map((s, i) => (
            <div key={i} className="dash-card" style={{ background: "#fff", borderRadius: 14, padding: "16px 12px", border: "1px solid #93c5fd20", textAlign: "center", boxShadow: "0 2px 10px rgba(30,58,95,0.04)", animationDelay: `${0.1 + i * 0.06}s` }}>
              <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><s.Scene size={44} /></div>
              <CircularProgress value={s.val} max={s.max} size={66} stroke={6} color={s.color}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: CL.txtL, fontWeight: 500 }}>/{s.max}</div>
              </CircularProgress>
              <div style={{ fontSize: 12, fontWeight: 600, color: NAT.deep, marginTop: 8 }}>{s.label}</div>
              <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10, display: "inline-block", background: s.val >= s.max ? "#dcfce7" : s.val > 0 ? NAT.warm : "#fef2f2", color: s.val >= s.max ? "#166534" : s.val > 0 ? CL.txtM : "#dc2626" }}>
                {s.val >= s.max ? "הושלם ✓" : s.val > 0 ? `${s.max - s.val} חסרים` : "טרם התחיל"}
              </div>
            </div>
          ))}
        </div>

        {/* ====== CHILDREN GRID ====== */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: NAT.deep, margin: 0, fontWeight: 800 }}>מצב ילדים</h3>
            <span style={{ fontSize: 11, color: CL.txtL, background: NAT.warm, padding: "4px 10px", borderRadius: 8, fontWeight: 500, border: "1px solid #93c5fd25" }}>
              {patients.filter(p => { const s = getStatus(p); return s.morning && s.evening && s.nursing; }).length}/{patients.length} הושלמו
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
            {patients.map((p, idx) => {
              const s = getStatus(p);
              const last = lastContact(p.id);
              const done = [s.morning, s.evening, s.nursing].filter(Boolean).length;
              const allDone = done === 3;
              const tot = totalTokens(p.tokens);
              const hasTasks = openTasks.some(t => t.childId === p.id);
              const bg = allDone ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : done > 0 ? `linear-gradient(135deg, ${NAT.warm}, ${NAT.warmD})` : "linear-gradient(135deg, #fff, #f8fafc)";
              const bdr = allDone ? "#86efac" : done > 0 ? "#93c5fd60" : CL.brd;
              return (
                <div key={p.id} className="child-card" onClick={() => onSelect(p.id)} style={{ background: bg, borderRadius: 14, padding: "14px 16px", border: `1px solid ${bdr}`, boxShadow: "0 2px 8px rgba(30,58,95,0.04)", animationDelay: `${0.08 + idx * 0.025}s`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, left: 0, height: 3, background: "#93c5fd20", borderRadius: "14px 14px 0 0" }}>
                    <div style={{ height: "100%", width: `${(done / 3) * 100}%`, background: allDone ? "#22c55e" : "#f59e0b", borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: allDone ? "linear-gradient(135deg, #22c55e, #16a34a)" : `linear-gradient(135deg, ${NAT.mid}, ${NAT.accent})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800, boxShadow: "0 2px 6px rgba(30,58,95,0.12)" }}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: NAT.deep, lineHeight: 1.2 }}>{p.name}</div>
                        {p.shift && <div style={{ fontSize: 10, color: CL.txtL }}>צוותון {p.shift}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      {hasTasks && <span style={{ fontSize: 12, animation: "pulse 2s ease infinite" }}>📌</span>}
                      {tot > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: "#b45309", background: "#fef3c7", padding: "1px 5px", borderRadius: 6 }}>🪙{tot}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {[{ done: s.morning, icon: "🌅", c: "#f59e0b" }, { done: s.evening, icon: "🌆", c: "#6366f1" }, { done: s.nursing, icon: "🏡", c: "#ef4444" }].map((x, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", borderRadius: 6, fontSize: 10, background: x.done ? `${x.c}10` : "rgba(0,0,0,0.02)", border: `1px solid ${x.done ? `${x.c}30` : "transparent"}` }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: x.done ? x.c : "#d1d5db", boxShadow: x.done ? `0 0 6px ${x.c}50` : "none" }} />
                        <span style={{ fontWeight: 600, color: x.done ? x.c : CL.txtL }}>{x.icon}</span>
                      </div>
                    ))}
                  </div>
                  {last && <div style={{ fontSize: 10, color: CL.txtL, marginTop: 6 }}>קשר: {timeSince(last.timestamp)}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ====== FEED ====== */}
        {recentContacts.length > 0 && (
          <div className="dash-card" style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #93c5fd20", boxShadow: "0 2px 10px rgba(30,58,95,0.03)", animationDelay: "0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${NAT.deep}, ${NAT.mid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>📋</div>
              <h3 style={{ margin: 0, fontSize: 15, color: NAT.deep, fontWeight: 700 }}>פעילות אחרונה</h3>
            </div>
            {recentContacts.map((c, i) => {
              const p = patients.find(x => x.id === c.childId); const ct = CONTACT_TYPES.find(t => t.id === c.type);
              return (
                <div key={i} className="feed-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: i % 2 === 0 ? NAT.warm : "#fff", borderRadius: 8, fontSize: 12, borderRight: `3px solid ${ct?.color || CL.brd}`, marginBottom: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `${ct?.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{ct?.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontWeight: 700, color: NAT.deep }}>{p?.name}</span><span style={{ color: CL.txtL }}>·</span><span style={{ color: ct?.color, fontWeight: 600, fontSize: 11 }}>{ct?.label}</span></div>
                    <div style={{ fontSize: 10, color: CL.txtL }}>{c.staffName}</div>
                  </div>
                  {c.tokensAwarded && Object.entries(c.tokensAwarded).filter(([, v]) => v > 0).map(([k, v]) => { const tt = TOKEN_TYPES.find(t => t.id === k); return tt ? <span key={k} style={{ fontSize: 10, fontWeight: 700, color: tt.color, background: `${tt.color}12`, padding: "2px 5px", borderRadius: 4 }}>{tt.icon}×{v}</span> : null; })}
                  <span style={{ fontSize: 10, color: CL.txtL, whiteSpace: "nowrap", fontWeight: 500 }}>{fmtDate(c.date)} {c.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
function PatientDetail({ patient, contacts, onUpdate, tasks, onResolveTask }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showStaff, setShowStaff] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedDay, setSchedDay] = useState(0);
  const [schedItem, setSchedItem] = useState({ time: "", activity: "" });

  const pc = contacts.filter(c => c.childId === patient.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const tokens = (patient.tokens && typeof patient.tokens === "object") ? patient.tokens : { growth: 0, adl: 0, home: 0 };
  const tot = totalTokens(tokens);
  const goals = patient.currentGoals || { growth: "", adl: "", home: "" };
  const patientTasks = tasks.filter(t => t.childId === patient.id && !t.resolved);

  const startEdit = () => { setEditData({ ...patient }); setEditing(true); };
  const startStaffEdit = () => { setEditData({ ...patient }); setShowStaff(true); };
  const startGoalsEdit = () => { setEditData({ ...patient, currentGoals: { ...goals } }); setShowGoals(true); };
  const startScheduleEdit = () => { setEditData({ ...patient }); setShowSchedule(true); };
  const saveEdit = () => { onUpdate(editData); setEditing(false); };
  const saveStaff = () => { onUpdate(editData); setShowStaff(false); };
  const saveGoals = () => { onUpdate(editData); setShowGoals(false); };

  const addToken = (type, n = 1) => { const t = { ...tokens, [type]: (tokens[type] || 0) + n }; onUpdate({ ...patient, tokens: t }); };
  const removeToken = type => { const t = { ...tokens, [type]: Math.max(0, (tokens[type] || 0) - 1) }; onUpdate({ ...patient, tokens: t }); };

  const addSchedItem = () => {
    if (!schedItem.time || !schedItem.activity) return;
    const day = DAYS_HEB[schedDay];
    const ws = { ...(editData.weeklySchedule || {}) };
    ws[day] = [...(ws[day] || []), { ...schedItem, id: Date.now() }];
    setEditData({ ...editData, weeklySchedule: ws });
    setSchedItem({ time: "", activity: "" });
  };
  const removeSchedItem = (day, id) => {
    const ws = { ...(editData.weeklySchedule || {}) };
    ws[day] = (ws[day] || []).filter(x => x.id !== id);
    setEditData({ ...editData, weeklySchedule: ws });
  };

  const staffEntries = STAFF_ROLES.filter(r => patient.staff?.[r.id]).map(r => ({ ...r, person: patient.staff[r.id] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Profile */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: CL.pri }}>
              {patient.name}{patient.age && <span style={{ fontSize: 13, color: CL.txtL, fontWeight: 400 }}> — גיל {patient.age}</span>}
            </h2>
            {patient.shift && <Badge bg="#edf2f7" color={CL.pri} style={{ marginTop: 4 }}>צוותון {patient.shift}</Badge>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn v="secondary" sm onClick={startEdit}>✏️ פרטים</Btn>
            <Btn v="secondary" sm onClick={startStaffEdit}>👥 צוות</Btn>
            <Btn v="secondary" sm onClick={startGoalsEdit}>🎯 מטרות</Btn>
          </div>
        </div>
        {staffEntries.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
            {staffEntries.map(s => <Badge key={s.id} bg={`${s.color}15`} color={s.color}>{s.icon} {s.label}: {s.person}</Badge>)}
          </div>
        )}
        {patient.notes && <p style={{ fontSize: 12, color: CL.txtM, marginTop: 8, lineHeight: 1.5 }}>{patient.notes}</p>}

        {/* Current goals */}
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0fff4", borderRadius: 8, border: "1px solid #c6f6d5" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#276749", marginBottom: 6 }}>מטרות נוכחיות</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TOKEN_TYPES.map(tt => (
              <div key={tt.id} style={{ fontSize: 12, color: goals[tt.id] ? CL.txt : CL.txtL }}>
                <span style={{ fontWeight: 600, color: tt.color }}>{tt.icon} {tt.label}:</span> {goals[tt.id] || "לא הוגדרה"}
              </div>
            ))}
          </div>
        </div>

        {/* Tokens */}
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🪙</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: "#b45309" }}>{tot}</span>
            <span style={{ fontSize: 12, color: CL.txtM }}>סה"כ אסימונים</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {TOKEN_TYPES.map(tt => (
              <div key={tt.id} style={{ padding: "6px 8px", background: "#fff", borderRadius: 8, border: `1px solid ${CL.brd}`, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tt.color, marginBottom: 2 }}>{tt.icon} {tt.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: tt.color }}>{tokens[tt.id] || 0}</div>
                <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 3 }}>
                  <Btn v="success" sm onClick={() => addToken(tt.id)} style={{ padding: "2px 8px", fontSize: 11 }}>+1</Btn>
                  <Btn v="ghost" sm onClick={() => removeToken(tt.id)} style={{ padding: "2px 8px", fontSize: 11 }}>−1</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Pending tasks */}
      {patientTasks.length > 0 && (
        <Card style={{ background: "#fef2f2", borderRight: "4px solid #ef4444" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", marginBottom: 6 }}>📌 בקשות פתוחות לשיחה</div>
          {patientTasks.map(task => {
            const role = STAFF_ROLES.find(r => r.id === task.targetRole);
            return (
              <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#fff", borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
                <Badge bg={`${role?.color}15`} color={role?.color}>{role?.icon} {task.targetName} ({role?.label})</Badge>
                <span style={{ color: CL.txtM }}>מבקש: {task.requesterName}</span>
                {task.reason && <span style={{ color: CL.txtM }}>— {task.reason}</span>}
                <Btn v="success" sm onClick={() => onResolveTask(task.id)} style={{ marginRight: "auto" }}>✓</Btn>
              </div>
            );
          })}
        </Card>
      )}

      {/* Schedule */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: CL.pri }}>📅 לוז שבועי</h3>
          <Btn v="secondary" sm onClick={startScheduleEdit}>✏️ ערוך</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, overflowX: "auto" }}>
          {DAYS_HEB.map((day, i) => {
            const items = (patient.weeklySchedule || {})[day] || [];
            const isToday = new Date().getDay() === i;
            // Get contacts for this day of the week
            const dayContacts = pc.filter(c => {
              const contactDate = new Date(c.date);
              return contactDate.getDay() === i;
            });
            return (
              <div key={day} style={{ background: isToday ? "#ebf8ff" : "#f7fafc", borderRadius: 6, padding: 6, minWidth: 90, border: isToday ? "2px solid #3182ce" : `1px solid ${CL.brd}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#2b6cb0" : CL.txtM, textAlign: "center", marginBottom: 4 }}>{day}</div>
                {items.sort((a, b) => a.time.localeCompare(b.time)).map((item, j) => (
                  <div key={j} style={{ fontSize: 10, padding: "2px 4px", marginBottom: 2, background: "#fff", borderRadius: 3, borderRight: "2px solid #3182ce" }}>
                    <div style={{ fontWeight: 600 }}>{item.time}</div>
                    <div style={{ color: CL.txtM }}>{item.activity}</div>
                  </div>
                ))}
                {dayContacts.slice(0, 3).map((c, j) => {
                  const ct = CONTACT_TYPES.find(t => t.id === c.type);
                  return (
                    <div key={`c${j}`} style={{ fontSize: 10, padding: "2px 4px", marginBottom: 2, background: "#fff", borderRadius: 3, borderRight: `2px solid ${ct?.color || "#888"}` }}>
                      <div style={{ fontWeight: 600 }}>{c.time} {ct?.icon}</div>
                      <div style={{ color: CL.txtM }}>{c.staffName}</div>
                      {c.contactPerson && <div style={{ color: CL.txtL, fontSize: 9 }}>📞 {c.contactPerson}</div>}
                    </div>
                  );
                })}
                {items.length === 0 && dayContacts.length === 0 && <div style={{ fontSize: 10, color: CL.txtL, textAlign: "center" }}>—</div>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Contact log */}
      <Card>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, color: CL.pri }}>📞 יומן קשר ({pc.length})</h3>
        {pc.length === 0 ? <p style={{ color: CL.txtL, fontSize: 12 }}>אין רשומות</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pc.slice(0, 25).map((c, i) => {
              const ct = CONTACT_TYPES.find(t => t.id === c.type);
              return (
                <div key={i} style={{ padding: 10, background: "#f7fafc", borderRadius: 8, borderRight: `3px solid ${ct?.color || CL.brd}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>{ct?.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{ct?.label}</span>
                      {c.method && <Badge>{c.method}</Badge>}
                    </div>
                    <span style={{ fontSize: 10, color: CL.txtL }}>{fmtDate(c.date)} {c.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: CL.txtM, marginTop: 4 }}><strong>צוות:</strong> {c.staffName}</div>
                  {c.contactPerson && <div style={{ fontSize: 11, color: CL.txtM }}><strong>איש קשר:</strong> {c.contactPerson}</div>}
                  {c.activity && <div style={{ fontSize: 11, color: CL.txtM }}><strong>עדכון:</strong> {c.activity}</div>}
                  {c.goal && <div style={{ fontSize: 11, color: CL.txtM }}><strong>מטרה:</strong> {c.goal}</div>}
                  {c.tokensAwarded && Object.entries(c.tokensAwarded).filter(([, v]) => v > 0).length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                      {Object.entries(c.tokensAwarded).filter(([, v]) => v > 0).map(([k, v]) => {
                        const tt = TOKEN_TYPES.find(t => t.id === k);
                        return tt ? <Badge key={k} bg={`${tt.color}18`} color={tt.color}>{tt.icon} ×{v}</Badge> : null;
                      })}
                    </div>
                  )}
                  {c.childPresent && <div style={{ fontSize: 11, color: CL.txtM }}>👦 מפגש בנוכחות הילד</div>}
                  {c.notes && <div style={{ fontSize: 11, color: CL.txt, marginTop: 3, padding: "3px 6px", background: "#fff", borderRadius: 4 }}>{c.notes}</div>}
                  {c.staffRequest && <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 3 }}>📌 בקשה לשיחה עם {c.staffRequest.targetName}</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <Modal open={editing} onClose={() => setEditing(false)} title={`עריכת פרטים — ${patient.name}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>שם</label><Inp value={editData.name || ""} onChange={v => setEditData({ ...editData, name: v })} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>גיל</label><Inp value={editData.age || ""} onChange={v => setEditData({ ...editData, age: v })} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>צוותון</label><Sel value={editData.shift || ""} onChange={v => setEditData({ ...editData, shift: v })} options={["רביעי", "שלישי"]} placeholder="בחר" style={{ width: "100%" }} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>הערות</label><TArea value={editData.notes || ""} onChange={v => setEditData({ ...editData, notes: v })} /></div>
          <Btn onClick={saveEdit} full>💾 שמירה</Btn>
        </div>
      </Modal>

      <Modal open={showStaff} onClose={saveStaff} title={`צוות מטפל — ${patient.name}`} wide>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {STAFF_ROLES.map(r => (
            <div key={r.id}>
              <label style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{r.icon} {r.label}</label>
              {r.id === "counselor" ? (
                <Sel value={editData.staff?.[r.id] || ""} onChange={v => setEditData({ ...editData, staff: { ...(editData.staff || {}), [r.id]: v } })}
                  options={COUNSELORS.map(n => ({ value: n, label: n }))} placeholder="בחר מדריך/ה" style={{ width: "100%" }} />
              ) : r.id === "nurse" ? (
                <Sel value={editData.staff?.[r.id] || ""} onChange={v => setEditData({ ...editData, staff: { ...(editData.staff || {}), [r.id]: v } })}
                  options={NURSES.map(n => ({ value: n, label: n }))} placeholder="בחר אח/ות" style={{ width: "100%" }} />
              ) : (
                <Inp value={editData.staff?.[r.id] || ""} onChange={v => setEditData({ ...editData, staff: { ...(editData.staff || {}), [r.id]: v } })} placeholder={`שם ${r.label}`} />
              )}
            </div>
          ))}
        </div>
        <Btn onClick={saveStaff} full style={{ marginTop: 12 }}>💾 שמירה</Btn>
      </Modal>

      <Modal open={showGoals} onClose={saveGoals} title={`מטרות נוכחיות — ${patient.name}`}>
        <p style={{ fontSize: 12, color: CL.txtM, margin: "0 0 10px" }}>מטרות אלו יופיעו בכל תיעוד שיחה עם מדריך/ה</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TOKEN_TYPES.map(tt => (
            <div key={tt.id}>
              <label style={{ fontSize: 12, fontWeight: 600, color: tt.color }}>{tt.icon} {tt.label}</label>
              <Inp value={editData.currentGoals?.[tt.id] || ""} onChange={v => setEditData({ ...editData, currentGoals: { ...(editData.currentGoals || {}), [tt.id]: v } })} placeholder={`תאר/י את ${tt.label}`} />
            </div>
          ))}
          <Btn onClick={saveGoals} full>💾 שמירה</Btn>
        </div>
      </Modal>

      <Modal open={showSchedule} onClose={() => { onUpdate(editData); setShowSchedule(false); }} title="עריכת לוז שבועי">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Sel value={schedDay} onChange={v => setSchedDay(Number(v))} options={DAYS_HEB.map((d, i) => ({ value: i, label: d }))} style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: 6 }}>
            <Inp value={schedItem.time} onChange={v => setSchedItem({ ...schedItem, time: v })} type="time" style={{ width: 110 }} />
            <Inp value={schedItem.activity} onChange={v => setSchedItem({ ...schedItem, activity: v })} placeholder="פעילות" style={{ flex: 1 }} />
          </div>
          <Btn v="secondary" onClick={addSchedItem}>➕ הוסף</Btn>
          {DAYS_HEB.map(day => {
            const items = (editData.weeklySchedule || {})[day] || [];
            if (!items.length) return null;
            return <div key={day}>
              <div style={{ fontSize: 12, fontWeight: 700, color: CL.pri, marginBottom: 3 }}>{day}</div>
              {items.sort((a, b) => a.time.localeCompare(b.time)).map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 6px", background: "#f7fafc", borderRadius: 4, marginBottom: 2 }}>
                  <span>{item.time} — {item.activity}</span>
                  <button onClick={() => removeSchedItem(day, item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: CL.err, fontSize: 13 }}>✕</button>
                </div>
              ))}
            </div>;
          })}
        </div>
      </Modal>
    </div>
  );
}

// ===================== LOG CONTACT =====================
function LogContact({ patients, staffList, onSave, onUpdatePatient, onAddTask }) {
  const empty = { childId: "", type: "morning", staffName: "", staffRole: "", contactPerson: "", method: "טלפון", activity: "", goal: "", notes: "", childPresent: false, date: today(), time: "08:30", tokensAwarded: { growth: 0, adl: 0, home: 0 }, requestStaff: false, requestTarget: "", requestReason: "", professionalRole: "" };
  const [form, setForm] = useState(empty);
  const [saved, setSaved] = useState(false);
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const selectedPatient = patients.find(p => p.id === form.childId);
  const contactType = CONTACT_TYPES.find(t => t.id === form.type);
  const goals = selectedPatient?.currentGoals || { growth: "", adl: "", home: "" };

  const isCounselor = form.type === "morning" || form.type === "evening";
  const isNursing = form.type === "nursing";
  const isProfessional = form.type === "professional";

  // Staff names for the selected professional role
  const professionalStaffOptions = isProfessional && form.professionalRole ? (PROFESSIONAL_STAFF[form.professionalRole] || []) : [];

  // Professional staff for selected patient (for request)
  const patientProfessionals = selectedPatient ? PROFESSIONAL_ROLES.filter(r => selectedPatient.staff?.[r.id]).map(r => ({
    roleId: r.id, roleName: r.label, icon: r.icon, color: r.color, name: selectedPatient.staff[r.id],
  })) : [];

  // All professionals for staff request dropdown
  const allProfessionals = PROFESSIONAL_ROLES.flatMap(r =>
    (PROFESSIONAL_STAFF[r.id] || []).map(name => ({
      roleId: r.id, roleName: r.label, icon: r.icon, color: r.color, name
    }))
  );

  const allStaffNames = [...new Set([...staffList.map(s => s.name), ...patients.flatMap(p => Object.values(p.staff || {}).filter(Boolean))])];

  const handleChildSelect = (childId) => {
    const patient = patients.find(p => p.id === childId);
    const ct = CONTACT_TYPES.find(t => t.id === form.type);
    let staffName = form.staffName;
    if (patient && ct?.role) {
      const assigned = patient.staff?.[ct.role];
      if (assigned) staffName = assigned;
    }
    setForm(prev => ({ ...prev, childId, staffName, staffRole: ct?.role || prev.staffRole, requestStaff: false, requestTarget: "", requestReason: "" }));
  };

  const handleTypeSelect = (typeId) => {
    const ct = CONTACT_TYPES.find(t => t.id === typeId);
    let staffName = "";
    if (typeId !== "professional" && selectedPatient && ct?.role) {
      const assigned = selectedPatient.staff?.[ct.role];
      if (assigned) staffName = assigned;
    }
    setForm(prev => ({ ...prev, type: typeId, staffRole: ct?.role || "", staffName, time: ct?.time || prev.time, tokensAwarded: { growth: 0, adl: 0, home: 0 }, professionalRole: "" }));
  };

  const submit = () => {
    if (!form.childId || !form.staffName) return;
    const contact = { ...form, timestamp: new Date().toISOString(), id: Date.now().toString() };
    // For professional contacts, store the specific role
    if (isProfessional && form.professionalRole) {
      contact.staffRole = form.professionalRole;
    }
    delete contact.requestStaff; delete contact.requestTarget; delete contact.requestReason; delete contact.professionalRole;
    if (form.requestStaff && form.requestTarget) {
      contact.staffRequest = { targetRole: form.requestTarget.split("|")[0], targetName: form.requestTarget.split("|")[1] };
    }
    onSave(contact);

    // Award tokens
    if (selectedPatient) {
      const currentTokens = (selectedPatient.tokens && typeof selectedPatient.tokens === "object") ? { ...selectedPatient.tokens } : { growth: 0, adl: 0, home: 0 };
      let changed = false;
      for (const tt of TOKEN_TYPES) {
        if (form.tokensAwarded[tt.id] > 0) { currentTokens[tt.id] = (currentTokens[tt.id] || 0) + form.tokensAwarded[tt.id]; changed = true; }
      }
      if (changed) onUpdatePatient({ ...selectedPatient, tokens: currentTokens });
    }

    // Create task if requested
    if (form.requestStaff && form.requestTarget && selectedPatient) {
      const [targetRole, targetName] = form.requestTarget.split("|");
      onAddTask({
        id: Date.now().toString() + "_task",
        childId: form.childId,
        childName: selectedPatient.name,
        requesterName: form.staffName,
        targetRole, targetName,
        reason: form.requestReason,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    setForm({ ...empty });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <h3 style={{ margin: "0 0 14px", fontSize: 17, color: CL.pri }}>📝 תיעוד שיחה / קשר</h3>
      {saved && <div style={{ padding: 10, background: "#c6f6d5", borderRadius: 8, marginBottom: 12, textAlign: "center", fontWeight: 600, color: "#276749", fontSize: 14 }}>✅ נשמר בהצלחה!</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Type */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri, marginBottom: 4, display: "block" }}>סוג קשר</label>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {CONTACT_TYPES.map(t => (
              <button key={t.id} onClick={() => handleTypeSelect(t.id)} style={{
                padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                border: form.type === t.id ? `2px solid ${t.color}` : `1px solid ${CL.brd}`,
                background: form.type === t.id ? `${t.color}12` : "#fff", fontWeight: form.type === t.id ? 700 : 400,
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>ילד/ה *</label>
            <Sel value={form.childId} onChange={handleChildSelect} options={patients.map(p => ({ value: p.id, label: p.name }))} placeholder="בחר" style={{ width: "100%" }} />
          </div>

          {isProfessional ? (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>תפקיד *</label>
                <Sel value={form.professionalRole} onChange={v => { f("professionalRole", v); f("staffName", ""); f("staffRole", v); }}
                  options={PROFESSIONAL_ROLES.map(r => ({ value: r.id, label: `${r.icon} ${r.label}` }))}
                  placeholder="בחר תפקיד" style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>איש/אשת צוות *</label>
                {professionalStaffOptions.length > 0 ? (
                  <Sel value={form.staffName} onChange={v => f("staffName", v)}
                    options={professionalStaffOptions.map(n => ({ value: n, label: n }))}
                    placeholder="בחר שם" style={{ width: "100%" }} />
                ) : (
                  <Inp value={form.staffName} onChange={v => f("staffName", v)} placeholder={form.professionalRole ? "הזן שם" : "בחר תפקיד קודם"} />
                )}
              </div>
            </>
          ) : (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>
                {contactType?.role === "counselor" ? "מדריך/ה *" : contactType?.role === "nurse" ? "אח/ות *" : "איש/אשת צוות *"}
              </label>
              {contactType?.role === "counselor" ? (
                <Sel value={form.staffName} onChange={v => f("staffName", v)} options={COUNSELORS.map(n => ({ value: n, label: n }))} placeholder="בחר מדריך/ה" style={{ width: "100%" }} />
              ) : contactType?.role === "nurse" ? (
                <Sel value={form.staffName} onChange={v => f("staffName", v)} options={NURSES.map(n => ({ value: n, label: n }))} placeholder="בחר אח/ות" style={{ width: "100%" }} />
              ) : (
                <><Inp value={form.staffName} onChange={v => f("staffName", v)} placeholder="שם" list="sn" /><datalist id="sn">{allStaffNames.map((n, i) => <option key={i} value={n} />)}</datalist></>
              )}
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>איש קשר (הורה/משפחה)</label>
            <Inp value={form.contactPerson} onChange={v => f("contactPerson", v)} placeholder="שם איש הקשר" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>אמצעי</label>
            <Sel value={form.method} onChange={v => f("method", v)} options={CONTACT_METHODS} style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>תאריך</label>
            <Inp type="date" value={form.date} onChange={v => f("date", v)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>שעה</label>
            <Inp type="time" value={form.time} onChange={v => f("time", v)} />
          </div>
        </div>

        {/* Show growth + home goals for counselor contacts */}
        {isCounselor && selectedPatient && (goals.growth || goals.home) && (
          <div style={{ padding: "10px 14px", background: "#f0fff4", borderRadius: 8, border: "1px solid #c6f6d5" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#276749", marginBottom: 6 }}>מטרות נוכחיות — {selectedPatient.name}</div>
            {goals.growth && (
              <div style={{ fontSize: 12, color: CL.txt, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: "#22c55e" }}>🎯 מטרת צמיחה:</span> {goals.growth}
              </div>
            )}
            {goals.home && (
              <div style={{ fontSize: 12, color: CL.txt, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: "#f59e0b" }}>🏡 מטרת בית:</span> {goals.home}
              </div>
            )}
          </div>
        )}

        {/* Show ADL goal for nursing contacts */}
        {isNursing && selectedPatient && goals.adl && (
          <div style={{ padding: "10px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", marginBottom: 4 }}>מטרת ADL נוכחית — {selectedPatient.name}</div>
            <div style={{ fontSize: 13, color: CL.txt }}>
              <span style={{ fontWeight: 600, color: "#0ea5e9" }}>🏠 </span>{goals.adl}
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>עדכון / הדרכת הורים</label>
          <TArea value={form.activity} onChange={v => f("activity", v)} placeholder="תיאור קצר של השיח" />
        </div>

        {/* Token awards */}
        {(isCounselor || isNursing) && (
          <div style={{ padding: "12px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#92400e", display: "block", marginBottom: 8 }}>🪙 הענקת אסימונים</label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {isCounselor && (
                <>
                  <div style={{ padding: "8px 12px", background: "#fff", borderRadius: 8, border: `1px solid ${CL.brd}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>🎯 מטרת צמיחה</div>
                    {goals.growth && <div style={{ fontSize: 10, color: CL.txtM, marginBottom: 4 }}>{goals.growth}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Btn v="ghost" sm onClick={() => f("tokensAwarded", { ...form.tokensAwarded, growth: Math.max(0, form.tokensAwarded.growth - 1) })} style={{ padding: "2px 8px" }}>−</Btn>
                      <span style={{ fontWeight: 800, fontSize: 16, color: "#22c55e", minWidth: 20, textAlign: "center" }}>{form.tokensAwarded.growth}</span>
                      <Btn v="success" sm onClick={() => f("tokensAwarded", { ...form.tokensAwarded, growth: form.tokensAwarded.growth + 1 })} style={{ padding: "2px 8px" }}>+</Btn>
                    </div>
                  </div>
                  <div style={{ padding: "8px 12px", background: "#fff", borderRadius: 8, border: `1px solid ${CL.brd}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", marginBottom: 4 }}>🏡 מטרת בית</div>
                    {goals.home && <div style={{ fontSize: 10, color: CL.txtM, marginBottom: 4 }}>{goals.home}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Btn v="ghost" sm onClick={() => f("tokensAwarded", { ...form.tokensAwarded, home: Math.max(0, form.tokensAwarded.home - 1) })} style={{ padding: "2px 8px" }}>−</Btn>
                      <span style={{ fontWeight: 800, fontSize: 16, color: "#f59e0b", minWidth: 20, textAlign: "center" }}>{form.tokensAwarded.home}</span>
                      <Btn v="success" sm onClick={() => f("tokensAwarded", { ...form.tokensAwarded, home: form.tokensAwarded.home + 1 })} style={{ padding: "2px 8px" }}>+</Btn>
                    </div>
                  </div>
                </>
              )}
              {isNursing && (
                <div style={{ padding: "8px 12px", background: "#fff", borderRadius: 8, border: `1px solid ${CL.brd}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#0ea5e9", marginBottom: 4 }}>🏠 מטרת ADL</div>
                  {goals.adl && <div style={{ fontSize: 10, color: CL.txtM, marginBottom: 4 }}>{goals.adl}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Btn v="ghost" sm onClick={() => f("tokensAwarded", { ...form.tokensAwarded, adl: Math.max(0, form.tokensAwarded.adl - 1) })} style={{ padding: "2px 8px" }}>−</Btn>
                    <span style={{ fontWeight: 800, fontSize: 16, color: "#0ea5e9", minWidth: 20, textAlign: "center" }}>{form.tokensAwarded.adl}</span>
                    <Btn v="success" sm onClick={() => f("tokensAwarded", { ...form.tokensAwarded, adl: form.tokensAwarded.adl + 1 })} style={{ padding: "2px 8px" }}>+</Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={form.childPresent} onChange={e => f("childPresent", e.target.checked)} style={{ width: 16, height: 16 }} />
          <label style={{ fontSize: 12, color: CL.pri }}>מפגש בנוכחות הילד</label>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: CL.pri }}>דגשים / תיאום צוות</label>
          <TArea value={form.notes} onChange={v => f("notes", v)} />
        </div>

        {/* Request staff conversation */}
        {selectedPatient && (
          <div style={{ padding: "12px 14px", background: "#faf5ff", borderRadius: 8, border: "1px solid #e9d5ff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input type="checkbox" checked={form.requestStaff} onChange={e => f("requestStaff", e.target.checked)} style={{ width: 16, height: 16 }} />
              <label style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>📌 בקשה לשיחה עם צוות מקצועי</label>
            </div>
            {form.requestStaff && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <Sel value={form.requestTarget} onChange={v => f("requestTarget", v)}
                  options={allProfessionals.map(p => ({ value: `${p.roleId}|${p.name}`, label: `${p.icon} ${p.name} (${p.roleName})` }))}
                  placeholder="בחר איש/אשת מקצוע" style={{ width: "100%" }} />
                <Inp value={form.requestReason} onChange={v => f("requestReason", v)} placeholder="סיבה / נושא (אופציונלי)" />
              </div>
            )}
          </div>
        )}

        <Btn onClick={submit} disabled={!form.childId || !form.staffName} full style={{ padding: 13, fontSize: 14 }}>
          💾 שמור רשומת קשר
        </Btn>
      </div>
    </Card>
  );
}

// ===================== STAFF MATRIX =====================
function StaffMatrix({ patients, onUpdatePatient }) {
  const [editingPatient, setEditingPatient] = useState(null);
  const [editStaff, setEditStaff] = useState({});
  const startEdit = p => { setEditStaff({ ...(p.staff || {}) }); setEditingPatient(p); };
  const saveEdit = () => { if (editingPatient) { onUpdatePatient({ ...editingPatient, staff: editStaff }); setEditingPatient(null); } };

  return (
    <Card>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, color: CL.pri }}>👥 מטריצת צוות מטפל</h3>
      <p style={{ fontSize: 11, color: CL.txtM, margin: "0 0 8px" }}>לחצו על שם מטופל/ת לעריכת הצוות</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, direction: "rtl" }}>
          <thead><tr>
            <th style={{ padding: "6px 8px", background: CL.pri, color: "#fff", borderRadius: "0 8px 0 0", position: "sticky", right: 0, zIndex: 1 }}>מטופל/ת</th>
            {STAFF_ROLES.map(r => <th key={r.id} style={{ padding: "6px 4px", background: `${r.color}20`, color: r.color, fontWeight: 700, whiteSpace: "nowrap", fontSize: 10 }}>{r.icon}<br />{r.label}</th>)}
          </tr></thead>
          <tbody>
            {patients.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#f7fafc", cursor: "pointer" }} onClick={() => startEdit(p)}>
                <td style={{ padding: "5px 8px", fontWeight: 700, color: CL.pri, position: "sticky", right: 0, background: i % 2 === 0 ? "#fff" : "#f7fafc", borderLeft: `1px solid ${CL.brd}` }}>{p.name} <span style={{ fontSize: 9, color: CL.txtL }}>✏️</span></td>
                {STAFF_ROLES.map(r => <td key={r.id} style={{ padding: "4px 4px", textAlign: "center", color: p.staff?.[r.id] ? CL.txt : CL.txtL, borderLeft: `1px solid ${CL.brd}`, fontSize: 10 }}>{p.staff?.[r.id] || "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!editingPatient} onClose={() => setEditingPatient(null)} title={`עריכת צוות — ${editingPatient?.name}`} wide>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {STAFF_ROLES.map(r => (
            <div key={r.id}>
              <label style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{r.icon} {r.label}</label>
              {r.id === "counselor" ? (
                <Sel value={editStaff[r.id] || ""} onChange={v => setEditStaff({ ...editStaff, [r.id]: v })} options={COUNSELORS.map(n => ({ value: n, label: n }))} placeholder="בחר מדריך/ה" style={{ width: "100%" }} />
              ) : r.id === "nurse" ? (
                <Sel value={editStaff[r.id] || ""} onChange={v => setEditStaff({ ...editStaff, [r.id]: v })} options={NURSES.map(n => ({ value: n, label: n }))} placeholder="בחר אח/ות" style={{ width: "100%" }} />
              ) : (
                <Inp value={editStaff[r.id] || ""} onChange={v => setEditStaff({ ...editStaff, [r.id]: v })} placeholder={`שם ${r.label}`} />
              )}
            </div>
          ))}
        </div>
        <Btn onClick={saveEdit} full style={{ marginTop: 12 }}>💾 שמירה</Btn>
      </Modal>
    </Card>
  );
}

// ===================== STAFF SECTION =====================
function StaffSection({ staffList, onUpdateList, staffUpdates, onAddUpdate, patients, onUpdatePatient }) {
  const [newStaff, setNewStaff] = useState({ name: "", role: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [updateForm, setUpdateForm] = useState({ staffName: "", content: "" });
  const allStaffNames = [...new Set([...staffList.map(s => s.name), ...patients.flatMap(p => Object.values(p.staff || {}).filter(Boolean))])];
  const addStaff = () => { if (!newStaff.name || !newStaff.role) return; onUpdateList([...staffList, { ...newStaff, id: Date.now().toString() }]); setNewStaff({ name: "", role: "" }); setShowAdd(false); };
  const submitUpdate = () => { if (!updateForm.staffName || !updateForm.content) return; onAddUpdate({ ...updateForm, timestamp: new Date().toISOString(), id: Date.now().toString() }); setUpdateForm({ staffName: "", content: "" }); };
  const grouped = STAFF_ROLES.map(r => ({ ...r, members: staffList.filter(s => s.role === r.id) })).filter(g => g.members.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <StaffMatrix patients={patients} onUpdatePatient={onUpdatePatient} />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: CL.pri }}>📋 רשימת צוות כללית</h3>
          <Btn v="secondary" sm onClick={() => setShowAdd(!showAdd)}>➕ הוסף</Btn>
        </div>
        {showAdd && (
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <Inp value={newStaff.name} onChange={v => setNewStaff({ ...newStaff, name: v })} placeholder="שם" style={{ flex: 1, minWidth: 120 }} />
            <Sel value={newStaff.role} onChange={v => setNewStaff({ ...newStaff, role: v })} options={STAFF_ROLES.map(r => ({ value: r.id, label: `${r.icon} ${r.label}` }))} placeholder="תפקיד" />
            <Btn sm onClick={addStaff}>הוסף</Btn>
          </div>
        )}
        {grouped.map(g => (
          <div key={g.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: g.color, marginBottom: 3 }}>{g.icon} {g.label}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {g.members.map(m => (
                <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", background: "#f7fafc", borderRadius: 6, fontSize: 11, border: `1px solid ${CL.brd}` }}>
                  {m.name}<button onClick={() => onUpdateList(staffList.filter(s => s.id !== m.id))} style={{ background: "none", border: "none", cursor: "pointer", color: CL.txtL, fontSize: 11 }}>✕</button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, color: CL.pri }}>💬 עדכוני צוות</h3>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <Inp value={updateForm.staffName} onChange={v => setUpdateForm({ ...updateForm, staffName: v })} placeholder="שם" list="sl2" style={{ flex: 1, minWidth: 120 }} />
          <datalist id="sl2">{allStaffNames.map((n, i) => <option key={i} value={n} />)}</datalist>
          <Inp value={updateForm.content} onChange={v => setUpdateForm({ ...updateForm, content: v })} placeholder="עדכון..." style={{ flex: 2, minWidth: 180 }} />
          <Btn sm onClick={submitUpdate}>שלח</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {staffUpdates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20).map((u, i) => (
            <div key={i} style={{ padding: "6px 10px", background: i % 2 === 0 ? "#f7fafc" : "#fff", borderRadius: 6, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
              <div><span style={{ fontWeight: 600, color: CL.pri }}>{u.staffName}:</span> <span style={{ color: CL.txtM }}>{u.content}</span></div>
              <span style={{ fontSize: 10, color: CL.txtL, whiteSpace: "nowrap" }}>{fmtDate(u.timestamp)} {fmtTime(u.timestamp)}</span>
            </div>
          ))}
          {staffUpdates.length === 0 && <p style={{ color: CL.txtL, fontSize: 12 }}>אין עדכונים</p>}
        </div>
      </Card>
    </div>
  );
}

// ===================== SETTINGS =====================
function Settings({ patients, contacts, staffList, staffUpdates, tasks, onImport, onLogout }) {
  const [importText, setImportText] = useState("");
  const exportAll = () => {
    const data = { patients, contacts, staffList, staffUpdates, tasks, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `ward-backup-${today()}.json`; a.click();
  };
  const importNames = () => {
    const names = importText.split("\n").map(n => n.trim()).filter(Boolean);
    if (!names.length) return;
    onImport(names.map((name, i) => ({ id: `p_${Date.now()}_${i}`, name, age: "", shift: "", staff: {}, currentGoals: { growth: "", adl: "", home: "" }, tokens: { growth: 0, adl: 0, home: 0 }, notes: "", weeklySchedule: {} })));
    setImportText("");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, color: CL.pri }}>📥 ייבוא שמות</h3>
        <p style={{ fontSize: 11, color: CL.txtM, margin: "0 0 6px" }}>שם אחד בכל שורה</p>
        <TArea value={importText} onChange={setImportText} rows={5} placeholder={"שם 1\nשם 2"} />
        <Btn v="secondary" onClick={importNames} disabled={!importText.trim()} style={{ marginTop: 6 }}>📥 ייבוא</Btn>
      </Card>
      <Card>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, color: CL.pri }}>💾 גיבוי</h3>
        <p style={{ fontSize: 11, color: CL.txtM, margin: "0 0 6px" }}>{patients.length} ילדים · {contacts.length} רשומות · {staffList.length} צוות</p>
        <Btn onClick={exportAll}>📤 ייצוא JSON</Btn>
      </Card>
      <Card>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, color: CL.pri }}>🚪 התנתקות</h3>
        <Btn v="danger" onClick={onLogout}>🔓 התנתק מהמערכת</Btn>
      </Card>
    </div>
  );
}

// ===================== MAIN =====================
const NAV = [
  { id: "dashboard", label: "דשבורד", icon: "🏠" },
  { id: "log", label: "תיעוד שיחה", icon: "📝" },
  { id: "staff", label: "צוות", icon: "👥" },
  { id: "settings", label: "הגדרות", icon: "⚙️" },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("ward-auth") === "true");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffUpdates, setStaffUpdates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);

  const handleLogin = () => {
    if (loginPassword.toUpperCase() === "HAKUNA MATATA") {
      localStorage.setItem("ward-auth", "true");
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ward-auth");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    (async () => {
      const [p, c, s, u, t] = await Promise.all([
        load(SK.patients, INITIAL_PATIENTS), load(SK.contacts, []), load(SK.staffList, []),
        load(SK.staffUpdates, []), load(SK.tasks, []),
      ]);
      setPatients(p); setContacts(c); setStaffList(s); setStaffUpdates(u); setTasks(t); setLoading(false);
      // Real-time sync: listen for changes from other team members
      if (isFirebaseReady) {
        dbListen(SK.patients, d => setPatients(d));
        dbListen(SK.contacts, d => setContacts(d));
        dbListen(SK.staffList, d => setStaffList(d));
        dbListen(SK.staffUpdates, d => setStaffUpdates(d));
        dbListen(SK.tasks, d => setTasks(d));
      }
    })();
  }, []);

  const saveP = useCallback(async p => { setPatients(p); await sav(SK.patients, p); }, []);
  const saveC = useCallback(async c => { setContacts(c); await sav(SK.contacts, c); }, []);
  const saveS = useCallback(async s => { setStaffList(s); await sav(SK.staffList, s); }, []);
  const saveU = useCallback(async u => { setStaffUpdates(u); await sav(SK.staffUpdates, u); }, []);
  const saveT = useCallback(async t => { setTasks(t); await sav(SK.tasks, t); }, []);

  const selectChild = id => { setSelectedId(id); setView("child"); };
  const updatePatient = p => saveP(patients.map(x => x.id === p.id ? p : x));
  const addContact = c => saveC([...contacts, c]);
  const addUpdate = u => saveU([...staffUpdates, u]);
  const addTask = t => saveT([...tasks, t]);
  const resolveTask = id => saveT(tasks.map(t => t.id === id ? { ...t, resolved: true, resolvedAt: new Date().toISOString() } : t));

  const selected = patients.find(p => p.id === selectedId);

  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo', 'Segoe UI', sans-serif", direction: "rtl", background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 35%, #3b6fb5 65%, #5b8dca 100%)" }}>
        <div style={{ textAlign: "center", color: "#fff", padding: 30 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🏠</div>
          <div style={{ fontSize: 22, fontWeight: 900, textShadow: "0 2px 8px rgba(0,0,0,0.15)", marginBottom: 8 }}>בבית עם הלב של המחלקה</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 24, fontWeight: 300, fontStyle: "italic" }}>🌿 HAKUNA MATATA 🌿</div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 24, maxWidth: 300, margin: "0 auto" }}>
            <div style={{ fontSize: 14, marginBottom: 12, fontWeight: 600 }}>🔐 הכנס סיסמא</div>
            <input
              type="password"
              value={loginPassword}
              onChange={e => { setLoginPassword(e.target.value); setLoginError(false); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="סיסמא..."
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: loginError ? "2px solid #ef4444" : "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, textAlign: "center", boxSizing: "border-box", outline: "none" }}
            />
            {loginError && <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 8 }}>סיסמא שגויה</div>}
            <button
              onClick={handleLogin}
              style={{ width: "100%", marginTop: 16, padding: "12px 24px", borderRadius: 8, border: "none", background: "#fff", color: "#1a365d", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >כניסה</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo', 'Segoe UI', sans-serif", direction: "rtl", background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 35%, #3b6fb5 65%, #5b8dca 100%)" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🏠</div>
        <div style={{ fontSize: 22, fontWeight: 900, textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>בבית עם הלב של המחלקה</div>
        <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6, fontWeight: 300, fontStyle: "italic" }}>🌿 HAKUNA MATATA 🌿</div>
        <div style={{ fontSize: 12, opacity: 0.4, marginTop: 8, fontWeight: 300 }}>טוען...</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif", direction: "rtl", background: "linear-gradient(180deg, #f0f7ff 0%, #e8f1fb 50%, #dfeaf6 100%)", minHeight: "100vh" }}>
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 35%, #3b6fb5 70%, #5b8dca 100%)",
        color: "#fff", padding: "14px 20px", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 20px rgba(30,58,95,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 28 }}>🏠</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>בבית עם הלב של המחלקה</div>
              <div style={{ fontSize: 10, opacity: .5, fontWeight: 300, fontStyle: "italic" }}>🌿 HAKUNA MATATA 🌿</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {tasks.filter(t => !t.resolved).length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                boxShadow: "0 2px 8px rgba(239,68,68,0.4)", display: "flex", alignItems: "center", gap: 4,
              }}>📌 {tasks.filter(t => !t.resolved).length}</div>
            )}
            <span style={{ fontSize: 11, opacity: .6, fontWeight: 300 }}>
              {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
          {view === "child" && (
            <button onClick={() => setView("dashboard")} style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8, color: "#fff", padding: "7px 14px",
              cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500,
              transition: "background 0.15s",
            }}>← חזרה</button>
          )}
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              background: view === n.id ? "rgba(147,197,253,0.3)" : "rgba(255,255,255,0.07)",
              border: view === n.id ? "1px solid rgba(147,197,253,0.5)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, color: "#fff", padding: "7px 14px",
              cursor: "pointer", fontSize: 12, fontFamily: "inherit",
              fontWeight: view === n.id ? 700 : 400,
              boxShadow: view === n.id ? "0 2px 8px rgba(44,82,130,0.25)" : "none",
              transition: "all 0.15s",
            }}>{n.icon} {n.label}</button>
          ))}
          {view !== "child" && (
            <Sel value="" onChange={v => { if (v) selectChild(v); }}
              options={patients.map(p => ({ value: p.id, label: p.name }))}
              placeholder="🔍 מטופל/ת..."
              dark
              style={{
                background: "#000", border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff", borderRadius: 8, fontSize: 12, padding: "7px 12px",
              }}
            />
          )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        {view === "dashboard" && <Dashboard patients={patients} contacts={contacts} tasks={tasks} onSelect={selectChild} onResolveTask={resolveTask} />}
        {view === "child" && selected && (
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <PatientDetail patient={selected} contacts={contacts} onUpdate={updatePatient} tasks={tasks} onResolveTask={resolveTask} />
            </div>
            <div style={{ width: 140, flexShrink: 0 }}>
              <div style={{ background: "#fff", borderRadius: 12, padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", position: "sticky", top: 80 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: CL.pri, marginBottom: 8, textAlign: "center" }}>👦 מטופלים</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {patients.map(p => (
                    <button key={p.id} onClick={() => selectChild(p.id)}
                      style={{
                        padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "right",
                        background: p.id === selected.id ? CL.pri : "#f0f4f8",
                        color: p.id === selected.id ? "#fff" : CL.txt,
                        transition: "all 0.15s"
                      }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {view === "log" && <LogContact patients={patients} staffList={staffList} onSave={addContact} onUpdatePatient={updatePatient} onAddTask={addTask} />}
        {view === "staff" && <StaffSection patients={patients} staffList={staffList} onUpdateList={saveS} staffUpdates={staffUpdates} onAddUpdate={addUpdate} onUpdatePatient={updatePatient} />}
        {view === "settings" && <Settings patients={patients} contacts={contacts} staffList={staffList} staffUpdates={staffUpdates} tasks={tasks} onImport={saveP} onLogout={handleLogout} />}
      </div>
    </div>
  );
}