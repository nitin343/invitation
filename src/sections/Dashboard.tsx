import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SERIF = `"Cormorant Garamond", ui-serif, Georgia, serif`;
const SANS  = `"Montserrat", ui-sans-serif, system-ui, sans-serif`;
const INK   = "#050a18";
const AMBER = "#ffb74d";

// --- Types ---
interface RSVP {
  id: string;
  name: string;
  phone: string;
  rsvpStatus: "attending" | "declined";
  meal: "veg" | "nonveg";
  totalGuests: number;
  message: string;
  createdAt: string;
}

export default function Dashboard({ onExit }: { onExit: () => void }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load data from Backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        setRsvps(json.guests || []);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    const fetchAISummary = async () => {
      try {
        const res = await fetch("/api/admin/ai-analysis");
        const json = await res.json();
        setAiSummary(json.summary);
      } catch (err) {
        console.error("AI Analysis failed");
      }
    };

    if (isAuthorized) {
      fetchStats();
      fetchAISummary();
    }
  }, [isAuthorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "wedding2026") {
      setIsAuthorized(true);
      setError("");
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  const stats = {
    total: rsvps.length,
    attending: rsvps.filter(r => r.rsvpStatus === "attending").length,
    declined: rsvps.filter(r => r.rsvpStatus === "declined").length,
    totalHeads: rsvps.reduce((acc, curr) => acc + (curr.rsvpStatus === "attending" ? curr.totalGuests : 0), 0),
    veg: rsvps.filter(r => r.rsvpStatus === "attending" && r.meal === "veg").length,
  };

  if (!isAuthorized) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: INK, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontFamily: SANS
      }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: 400, padding: 40, textAlign: "center" }}
        >
          <div style={{ fontSize: 40, marginBottom: 20 }}>👑</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, marginBottom: 8 }}>Admin Portal</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, letterSpacing: 4, textTransform: "uppercase", marginBottom: 32 }}>Wedding Management</p>
          
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input 
              type="password" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,183,77,0.2)",
                borderRadius: 8, padding: "16px",
                color: "#fff", textAlign: "center", fontSize: 18, letterSpacing: 8
              }}
            />
            {error && <p style={{ color: "#ff6b6b", fontSize: 12 }}>{error}</p>}
            <button type="submit" style={{
              background: "linear-gradient(135deg, #ffb74d, #f472b6)",
              border: "none", borderRadius: 8, padding: "16px",
              color: INK, fontWeight: 700, cursor: "pointer", letterSpacing: 2
            }}>ACCESS DASHBOARD</button>
            <button type="button" onClick={onExit} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, marginTop: 10 }}>← Back to Invite</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "#080c1a", color: "#fff", overflowY: "auto",
      padding: "clamp(20px, 5vw, 60px)", boxSizing: "border-box",
      fontFamily: SANS
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 4vw, 42px)", marginBottom: 8 }}>📋 RSVP Dashboard</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>Apoorva & Niteen Wedding</p>
        </div>
        <button onClick={onExit} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 20px", borderRadius: 50, cursor: "pointer", fontSize: 12 }}>Logout</button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 48 }}>
        <StatCard label="Total RSVPs" value={stats.total} color="#fff" />
        <StatCard label="Attending" value={stats.attending} color="#E6D8B5" />
        <StatCard label="Declined" value={stats.declined} color="#fecaca" />
        <StatCard label="Total Heads" value={stats.totalHeads} color={AMBER} />
      </div>

      {/* Meal Stats */}
      <div style={{ display: "flex", gap: 24, marginBottom: 48, background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <span style={{ display: "block", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>VEGETARIAN GUESTS</span>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{stats.veg}</span>
        </div>
      </div>

      {/* AI Insights */}
      {aiSummary && (
        <div style={{ marginBottom: 48, background: "rgba(251,191,36,0.05)", padding: 24, borderRadius: 16, border: "1px solid rgba(251,191,36,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <span style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, color: AMBER, textTransform: "uppercase" }}>AI Sentiment Analysis</span>
          </div>
          <div style={{ fontSize: 15, color: "rgba(232,223,208,0.9)", lineHeight: 1.6 }}>
            "{aiSummary}"
          </div>
        </div>
      )}

      {/* Guest List */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 20 }}>Guest List</h2>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Showing {rsvps.length} responses</span>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th style={thStyle}>Guest Name</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Heads</th>
                <th style={thStyle}>Meal</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Message</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.2)" }}>No RSVP data captured yet.</td>
                </tr>
              ) : (
                rsvps.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((rsvp) => (
                  <tr key={rsvp.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{rsvp.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>{new Date(rsvp.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ 
                        padding: "4px 10px", borderRadius: 50, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        background: rsvp.rsvpStatus === "attending" ? "rgba(230,216,181,0.1)" : "rgba(254,202,202,0.1)",
                        color: rsvp.rsvpStatus === "attending" ? "#E6D8B5" : "#fecaca"
                      }}>
                        {rsvp.rsvpStatus === "attending" ? "Attending" : "Declined"}
                      </span>
                    </td>
                    <td style={tdStyle}>{rsvp.rsvpStatus === "attending" ? `👥 ${rsvp.totalGuests}` : "-"}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>{rsvp.rsvpStatus === "attending" ? (rsvp.meal === "veg" ? "Vegetarian" : "Non-Veg") : "-"}</span>
                    </td>
                    <td style={tdStyle}>
                      <a href={`tel:${rsvp.phone}`} style={{ color: AMBER, textDecoration: "none", fontSize: 13 }}>{rsvp.phone}</a>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 200 }}>
                      <p style={{ fontSize: 12, opacity: 0.8, whiteSpace: "normal", wordBreak: "break-word" }}>
                        {rsvp.message ? `"${rsvp.message}"` : "-"}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      padding: 32, borderRadius: 24, background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column", gap: 8
    }}>
      <span style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{label}</span>
      <span style={{ fontSize: 48, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "20px 24px", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontWeight: 500
};

const tdStyle: React.CSSProperties = {
  padding: "20px 24px", verticalAlign: "top", whiteSpace: "nowrap"
};
